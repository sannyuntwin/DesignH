import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const fontsRoot = path.join(projectRoot, "public", "fonts");
const outputFile = path.join(projectRoot, "lib", "local-fonts.ts");

const exts = new Set([".woff2", ".woff", ".ttf", ".otf"]);
const formatByExt = {
  ".woff2": "woff2",
  ".woff": "woff",
  ".ttf": "truetype",
  ".otf": "opentype",
};

function walkFonts(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFonts(fullPath));
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (exts.has(ext)) {
      files.push(fullPath);
    }
  }

  return files;
}

function toTitle(raw) {
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function inferWeight(filename) {
  const value = filename.toLowerCase();
  return /(^|[^a-z])(bold|black|heavy|extrabold|semi[-_ ]?bold|demi[-_ ]?bold|bookbold)([^a-z]|$)/.test(value)
    ? "700"
    : "400";
}

function toPublicUrl(fullPath) {
  const relSegments = path.relative(path.join(projectRoot, "public"), fullPath).split(path.sep);
  return `/${relSegments.map((segment) => encodeURIComponent(segment)).join("/")}`;
}

function generateLocalFontManifest() {
  const files = fs.existsSync(fontsRoot) ? walkFonts(fontsRoot).sort((a, b) => a.localeCompare(b)) : [];
  const seenByStem = new Map();

  const faces = files.map((file) => {
    const ext = path.extname(file).toLowerCase();
    const stem = path.basename(file, ext);
    const parent = path.basename(path.dirname(file));
    const baseFamily = toTitle(stem) || "Custom Font";
    const stemSeenCount = seenByStem.get(baseFamily) || 0;
    const family = stemSeenCount > 0 ? `${baseFamily} (${toTitle(parent)})` : baseFamily;

    seenByStem.set(baseFamily, stemSeenCount + 1);

    return {
      family,
      source: toPublicUrl(file),
      format: formatByExt[ext],
      weight: inferWeight(stem),
    };
  });

  const families = faces.map((face) => face.family);

  const lines = [];
  lines.push("export type LocalFontFace = {");
  lines.push("  family: string;");
  lines.push("  source: string;");
  lines.push('  format: "woff2" | "woff" | "truetype" | "opentype";');
  lines.push('  weight: "400" | "700";');
  lines.push("};");
  lines.push("");
  lines.push("export const LOCAL_FONT_FACES: LocalFontFace[] = [");
  for (const face of faces) {
    lines.push(
      `  { family: ${JSON.stringify(face.family)}, source: ${JSON.stringify(face.source)}, format: ${JSON.stringify(face.format)}, weight: ${JSON.stringify(face.weight)} },`,
    );
  }
  lines.push("];");
  lines.push("");
  lines.push("export const LOCAL_FONT_FAMILIES: string[] = [");
  for (const family of families) {
    lines.push(`  ${JSON.stringify(family)},`);
  }
  lines.push("];");
  lines.push("");

  fs.writeFileSync(outputFile, lines.join("\n"));
  console.log(`Generated ${path.relative(projectRoot, outputFile)} (${faces.length} font files)`);
}

generateLocalFontManifest();
