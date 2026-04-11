import type { CanvasImageBox, CanvasTextBox } from "@/components/editor/DesignCanvas";

export type ExportDesignPage = {
  width: number;
  height: number;
  backgroundColor?: string;
  imageBoxes: CanvasImageBox[];
  textBoxes: CanvasTextBox[];
};

type ImageExportFormat = "png" | "jpg";

function normalizeNumber(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  const paragraphs = (text || "").split(/\r?\n/);

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const fits = ctx.measureText(candidate).width <= maxWidth;

      if (fits || !currentLine) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = word;
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

  ctx.fillStyle = page.backgroundColor || "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const drawItems = [
    ...page.imageBoxes.map((box) => ({ kind: "image" as const, layer: normalizeNumber(box.layer ?? 0, 0), box })),
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
        ctx.drawImage(image, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
        ctx.restore();
      } catch {
        // Skip broken image sources during export instead of failing the whole file.
      }
      continue;
    }

    const box = item.box;
    const boxX = normalizeNumber(box.x, 0);
    const boxY = normalizeNumber(box.y, 0);
    const boxWidth = Math.max(1, normalizeNumber(box.width, 260));
    const boxHeight = Math.max(1, normalizeNumber(box.height, 90));
    const fontSize = Math.max(8, normalizeNumber(box.fontSize ?? 42, 42));
    const fontWeight = box.fontWeight || "700";
    const color = box.color || "#0f172a";
    const align = box.textAlign || "left";
    const rotation = normalizeNumber(box.rotation ?? 0, 0);
    const lineHeight = fontSize * 1.2;

    ctx.save();
    ctx.translate(boxX + boxWidth / 2, boxY + boxHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-boxWidth / 2, -boxHeight / 2);
    ctx.beginPath();
    ctx.rect(0, 0, boxWidth, boxHeight);
    ctx.clip();

    ctx.fillStyle = color;
    ctx.font = `${fontWeight} ${fontSize}px Arial, sans-serif`;
    ctx.textBaseline = "top";
    ctx.textAlign = align;

    const maxLines = Math.max(1, Math.floor(boxHeight / lineHeight));
    const lines = wrapTextLines(ctx, box.text || "", boxWidth).slice(0, maxLines);
    const textX = align === "left" ? 0 : align === "center" ? boxWidth / 2 : boxWidth;

    lines.forEach((line, index) => {
      ctx.fillText(line, textX, index * lineHeight);
    });

    ctx.restore();
  }

  return canvas;
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

export async function exportDesignAsImage(page: ExportDesignPage, format: ImageExportFormat, filenameBase = "design") {
  const canvas = await renderPageToCanvas(page);
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
