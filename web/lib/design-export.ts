import type { CanvasImageBox, CanvasShapeBox, CanvasShapeKind, CanvasTextBox } from "@/components/editor/DesignCanvas";

export type ExportDesignPage = {
  width: number;
  height: number;
  backgroundColor?: string;
  gradientEnabled?: boolean;
  gradientDirection?: "vertical" | "horizontal";
  gradientColors?: readonly [string, string, string];
  borderWidth?: number;
  borderColor?: string;
  borderGradientEnabled?: boolean;
  borderGradientDirection?: "vertical" | "horizontal";
  borderGradientColors?: readonly [string, string, string];
  imageBoxes: CanvasImageBox[];
  shapeBoxes?: CanvasShapeBox[];
  textBoxes: CanvasTextBox[];
};

type ImageExportFormat = "png" | "jpg";

function normalizeNumber(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function sanitizeHexColor(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(trimmed) ? trimmed : fallback;
}

function escapeFontFamily(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function splitTokenByWidth(ctx: CanvasRenderingContext2D, token: string, maxWidth: number) {
  if (!token) return [""];
  if (ctx.measureText(token).width <= maxWidth) return [token];

  const parts: string[] = [];
  let current = "";

  for (const char of token) {
    const candidate = `${current}${char}`;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      parts.push(current);
      current = char;
    } else {
      current = candidate;
    }
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}

function getCoverSourceRect(sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number) {
  if (sourceWidth <= 0 || sourceHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) {
    return { sx: 0, sy: 0, sw: Math.max(1, sourceWidth), sh: Math.max(1, sourceHeight) };
  }

  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = targetWidth / targetHeight;

  if (sourceAspect > targetAspect) {
    const sw = Math.max(1, Math.round(sourceHeight * targetAspect));
    const sx = Math.max(0, Math.floor((sourceWidth - sw) / 2));
    return { sx, sy: 0, sw, sh: sourceHeight };
  }

  const sh = Math.max(1, Math.round(sourceWidth / targetAspect));
  const sy = Math.max(0, Math.floor((sourceHeight - sh) / 2));
  return { sx: 0, sy, sw: sourceWidth, sh };
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (maxWidth <= 0) return [""];

  const lines: string[] = [];
  const paragraphs = (text || "").split(/\r?\n/);

  for (const rawParagraph of paragraphs) {
    const paragraph = rawParagraph.replace(/\t/g, "    ");
    if (paragraph.length === 0) {
      lines.push("");
      continue;
    }

    const tokens = paragraph.match(/\s+|\S+/g) || [paragraph];
    let currentLine = "";

    for (const token of tokens) {
      const candidate = `${currentLine}${token}`;
      const fits = ctx.measureText(candidate).width <= maxWidth;

      if (fits || !currentLine) {
        currentLine = candidate;
        continue;
      }

      // Start a new line at token boundaries first to preserve spaces/tab alignment.
      lines.push(currentLine);

      if (ctx.measureText(token).width <= maxWidth) {
        currentLine = token;
      } else {
        const tokenParts = splitTokenByWidth(ctx, token, maxWidth);
        lines.push(...tokenParts.slice(0, -1));
        currentLine = tokenParts[tokenParts.length - 1] || "";
      }
    }

    lines.push(currentLine);
  }

  return lines;
}

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image for export."));
    image.src = src;
  });
}

async function ensureExportFontsLoaded(textBoxes: CanvasTextBox[]) {
  if (typeof document === "undefined" || !("fonts" in document)) return;

  const requests = textBoxes.map((box) => {
    const family = escapeFontFamily(box.fontFamily || "Arial");
    const weight = box.fontWeight || "700";
    const size = Math.max(8, normalizeNumber(box.fontSize ?? 42, 42));
    return `${weight} ${size}px "${family}"`;
  });

  await Promise.all(
    Array.from(new Set(requests)).map((fontSpec) => (document as Document & { fonts: FontFaceSet }).fonts.load(fontSpec).catch(() => [])),
  );
}

async function renderPageToCanvas(page: ExportDesignPage) {
  const width = Math.max(1, Math.round(normalizeNumber(page.width, 1)));
  const height = Math.max(1, Math.round(normalizeNumber(page.height, 1)));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas rendering is not supported in this browser.");
  }

  await ensureExportFontsLoaded(page.textBoxes);

  const fillColor = sanitizeHexColor(page.backgroundColor, "#ffffff");
  if (page.gradientEnabled) {
    const [start, middle, end] = page.gradientColors || ["#f8fafc", "#e2e8f0", "#cbd5e1"];
    const gradient =
      page.gradientDirection === "horizontal"
        ? ctx.createLinearGradient(0, 0, width, 0)
        : ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, sanitizeHexColor(start, "#f8fafc"));
    gradient.addColorStop(0.5, sanitizeHexColor(middle, "#e2e8f0"));
    gradient.addColorStop(1, sanitizeHexColor(end, "#cbd5e1"));
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = fillColor;
  }
  ctx.fillRect(0, 0, width, height);

  const rawBorderWidth = Math.max(0, normalizeNumber(page.borderWidth ?? 0, 0));
  const borderWidth = Math.min(rawBorderWidth, Math.floor(Math.min(width, height) / 2));
  if (borderWidth > 0) {
    if (page.borderGradientEnabled) {
      const [start, middle, end] = page.borderGradientColors || ["#0f172a", "#475569", "#0f172a"];
      const borderGradient =
        page.borderGradientDirection === "horizontal"
          ? ctx.createLinearGradient(0, 0, width, 0)
          : ctx.createLinearGradient(0, 0, 0, height);
      borderGradient.addColorStop(0, sanitizeHexColor(start, "#0f172a"));
      borderGradient.addColorStop(0.5, sanitizeHexColor(middle, "#475569"));
      borderGradient.addColorStop(1, sanitizeHexColor(end, "#0f172a"));
      ctx.strokeStyle = borderGradient;
    } else {
      ctx.strokeStyle = sanitizeHexColor(page.borderColor, "#0f172a");
    }
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);
  }

  const drawItems = [
    ...page.imageBoxes.map((box) => ({ kind: "image" as const, layer: normalizeNumber(box.layer ?? 0, 0), box })),
    ...(page.shapeBoxes || []).map((box) => ({ kind: "shape" as const, layer: normalizeNumber(box.layer ?? 0, 0), box })),
    ...page.textBoxes.map((box) => ({ kind: "text" as const, layer: normalizeNumber(box.layer ?? 0, 0), box })),
  ].sort((a, b) => a.layer - b.layer);

  for (const item of drawItems) {
    if (item.kind === "image") {
      const imageBox = item.box;
      if (!imageBox.src) continue;

      const imageX = normalizeNumber(imageBox.x, 0);
      const imageY = normalizeNumber(imageBox.y, 0);
      const imageWidth = Math.max(1, normalizeNumber(imageBox.width, 280));
      const imageHeight = Math.max(1, normalizeNumber(imageBox.height, 180));
      const imageOpacity = Math.max(0, Math.min(1, normalizeNumber(imageBox.opacity ?? 1, 1)));
      const imageRotation = normalizeNumber(imageBox.rotation ?? 0, 0);

      try {
        const image = await loadImage(imageBox.src);
        ctx.save();
        ctx.globalAlpha = imageOpacity;
        ctx.translate(imageX + imageWidth / 2, imageY + imageHeight / 2);
        ctx.rotate((imageRotation * Math.PI) / 180);

        // Match the editor's object-cover rendering and rounded image corners.
        const sourceRect = getCoverSourceRect(image.naturalWidth || image.width, image.naturalHeight || image.height, imageWidth, imageHeight);
        const destinationBleed = 0.75;
        roundedRectPath(ctx, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight, 4);
        ctx.clip();
        ctx.drawImage(
          image,
          sourceRect.sx,
          sourceRect.sy,
          sourceRect.sw,
          sourceRect.sh,
          -imageWidth / 2 - destinationBleed,
          -imageHeight / 2 - destinationBleed,
          imageWidth + destinationBleed * 2,
          imageHeight + destinationBleed * 2,
        );
        ctx.restore();
      } catch {
        // Skip broken image sources during export instead of failing the whole file.
      }
      continue;
    }

    if (item.kind === "shape") {
      const shapeBox = item.box;
      const shapeX = normalizeNumber(shapeBox.x, 0);
      const shapeY = normalizeNumber(shapeBox.y, 0);
      const shapeWidth = Math.max(1, normalizeNumber(shapeBox.width, 180));
      const shapeHeight = Math.max(1, normalizeNumber(shapeBox.height, 180));
      const shapeRotation = normalizeNumber(shapeBox.rotation ?? 0, 0);
      const shapeFillEnabled = shapeBox.fillEnabled !== false;
      const shapeFill = sanitizeHexColor(shapeBox.fillColor, "#38bdf8");
      const shapeGradientEnabled = shapeFillEnabled && Boolean(shapeBox.gradientEnabled);
      const shapeGradientDirection = shapeBox.gradientDirection === "horizontal" ? "horizontal" : "vertical";
      const [shapeGradientStart, shapeGradientMiddle, shapeGradientEnd] = shapeBox.gradientColors || ["#38bdf8", "#22d3ee", "#818cf8"];
      const shapeStroke = sanitizeHexColor(shapeBox.strokeColor, "#0f172a");
      const shapeStrokeWidth = Math.max(0, normalizeNumber(shapeBox.strokeWidth ?? 2, 2));
      const normalizedShapeStrokeWidth = Math.max(0, (shapeStrokeWidth * 100) / Math.max(shapeWidth, shapeHeight));
      const shapeType: CanvasShapeKind =
        shapeBox.shapeType === "circle" || shapeBox.shapeType === "triangle" ? shapeBox.shapeType : "square";

      ctx.save();
      ctx.translate(shapeX + shapeWidth / 2, shapeY + shapeHeight / 2);
      ctx.rotate((shapeRotation * Math.PI) / 180);
      ctx.beginPath();

      if (shapeType === "circle") {
        ctx.ellipse(0, 0, shapeWidth / 2, shapeHeight / 2, 0, 0, Math.PI * 2);
      } else if (shapeType === "triangle") {
        ctx.moveTo(0, -shapeHeight / 2);
        ctx.lineTo(shapeWidth / 2, shapeHeight / 2);
        ctx.lineTo(-shapeWidth / 2, shapeHeight / 2);
        ctx.closePath();
      } else {
        ctx.rect(-shapeWidth / 2, -shapeHeight / 2, shapeWidth, shapeHeight);
      }

      if (shapeGradientEnabled) {
        const shapeGradient =
          shapeGradientDirection === "horizontal"
            ? ctx.createLinearGradient(-shapeWidth / 2, 0, shapeWidth / 2, 0)
            : ctx.createLinearGradient(0, -shapeHeight / 2, 0, shapeHeight / 2);
        shapeGradient.addColorStop(0, sanitizeHexColor(shapeGradientStart, "#38bdf8"));
        shapeGradient.addColorStop(0.5, sanitizeHexColor(shapeGradientMiddle, "#22d3ee"));
        shapeGradient.addColorStop(1, sanitizeHexColor(shapeGradientEnd, "#818cf8"));
        ctx.fillStyle = shapeGradient;
        ctx.fill();
      } else if (shapeFillEnabled) {
        ctx.fillStyle = shapeFill;
        ctx.fill();
      }

      if (normalizedShapeStrokeWidth > 0) {
        ctx.lineWidth = normalizedShapeStrokeWidth;
        ctx.strokeStyle = shapeStroke;
        ctx.stroke();
      }

      ctx.restore();
      continue;
    }

    const box = item.box;
    const boxX = normalizeNumber(box.x, 0);
    const boxY = normalizeNumber(box.y, 0);
    const boxWidth = Math.max(1, normalizeNumber(box.width, 260));
    const boxHeight = Math.max(1, normalizeNumber(box.height, 90));
    const fontSize = Math.max(8, normalizeNumber(box.fontSize ?? 42, 42));
    const fontWeight = box.fontWeight || "700";
    const fontFamily = box.fontFamily || "Arial";
    const color = box.color || "#0f172a";
    const align = box.textAlign || "left";
    const rotation = normalizeNumber(box.rotation ?? 0, 0);
    const lineHeight = fontSize * 1.25;
    const topLeading = Math.max(0, (lineHeight - fontSize) / 2);

    ctx.save();
    ctx.translate(boxX + boxWidth / 2, boxY + boxHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-boxWidth / 2, -boxHeight / 2);

    ctx.fillStyle = color;
    ctx.font = `${fontWeight} ${fontSize}px "${escapeFontFamily(fontFamily)}", Arial, sans-serif`;
    ctx.textBaseline = "top";
    ctx.textAlign = align;

    const maxLines = Math.max(1, Math.floor(Math.max(lineHeight, boxHeight - topLeading) / lineHeight));
    const lines = wrapTextLines(ctx, box.text || "", boxWidth).slice(0, maxLines);
    const textX = align === "left" ? 0 : align === "center" ? boxWidth / 2 : boxWidth;

    lines.forEach((line, index) => {
      ctx.fillText(line, textX, topLeading + index * lineHeight);
    });

    ctx.restore();
  }

  return canvas;
}

async function renderElementToCanvas(sourceElement: HTMLElement) {
  const { default: html2canvas } = await import("html2canvas");
  const targetRect = sourceElement.getBoundingClientRect();

  return html2canvas(sourceElement, {
    backgroundColor: null,
    useCORS: true,
    scale: Math.max(1, window.devicePixelRatio || 1),
    width: Math.max(1, Math.round(targetRect.width)),
    height: Math.max(1, Math.round(targetRect.height)),
    logging: false,
    onclone: (clonedDoc) => {
      const style = clonedDoc.createElement("style");
      style.textContent = `
        [aria-label="Resize image"],
        [aria-label="Resize shape"],
        [aria-label="Resize text box"],
        [aria-label="Rotate shape"],
        [aria-label="Rotate text box"] {
          display: none !important;
        }
      `;
      clonedDoc.head.appendChild(style);

      const clonedCanvas = clonedDoc.getElementById("design-canvas") as HTMLElement | null;
      if (clonedCanvas) {
        clonedCanvas.style.boxShadow = "none";
        clonedCanvas.style.borderColor = "transparent";
      }

      clonedDoc.querySelectorAll<HTMLElement>("[data-canvas-element='true']").forEach((el) => {
        el.style.outline = "none";
        el.style.boxShadow = "none";
      });
    },
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to generate export file."));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function exportDesignAsImage(
  page: ExportDesignPage,
  format: ImageExportFormat,
  filenameBase = "design",
  sourceElement?: HTMLElement | null,
) {
  let canvas: HTMLCanvasElement;
  if (sourceElement) {
    try {
      canvas = await renderElementToCanvas(sourceElement);
    } catch {
      canvas = await renderPageToCanvas(page);
    }
  } else {
    canvas = await renderPageToCanvas(page);
  }

  const type = format === "png" ? "image/png" : "image/jpeg";
  const quality = format === "jpg" ? 0.92 : undefined;
  const blob = await canvasToBlob(canvas, type, quality);
  downloadBlob(blob, `${filenameBase}.${format}`);
}

export async function exportDesignAsPdf(pages: ExportDesignPage[], filenameBase = "design") {
  if (!pages.length) {
    throw new Error("Nothing to export.");
  }

  const { jsPDF } = await import("jspdf");
  const firstCanvas = await renderPageToCanvas(pages[0]);
  const firstOrientation = firstCanvas.width >= firstCanvas.height ? "landscape" : "portrait";

  const doc = new jsPDF({
    orientation: firstOrientation,
    unit: "px",
    format: [firstCanvas.width, firstCanvas.height],
  });

  doc.addImage(firstCanvas.toDataURL("image/png"), "PNG", 0, 0, firstCanvas.width, firstCanvas.height, undefined, "FAST");

  for (let i = 1; i < pages.length; i += 1) {
    const canvas = await renderPageToCanvas(pages[i]);
    const orientation = canvas.width >= canvas.height ? "landscape" : "portrait";
    doc.addPage([canvas.width, canvas.height], orientation);
    doc.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height, undefined, "FAST");
  }

  doc.save(`${filenameBase}.pdf`);
}
