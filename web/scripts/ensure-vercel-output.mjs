import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const sourceDir = resolve(".next");
const nestedOutputDir = resolve("web", ".next");

if (!existsSync(sourceDir)) {
  throw new Error(`Missing build output: ${sourceDir}`);
}

mkdirSync(resolve("web"), { recursive: true });
if (existsSync(nestedOutputDir)) {
  rmSync(nestedOutputDir, { recursive: true, force: true });
}

cpSync(sourceDir, nestedOutputDir, { recursive: true });
console.log(`Copied ${sourceDir} -> ${nestedOutputDir} for Vercel output compatibility.`);
