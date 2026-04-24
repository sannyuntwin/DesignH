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
const DEFAULT_TEXT_LINE_HEIGHT = 1.25;
const DEFAULT_IMAGE_BACKGROUND_COLOR = "";
const DEFAULT_IMAGE_SHADOW_COLOR = "#000000";
const DEFAULT_IMAGE_OUTLINE_COLOR = "#ffffff";
const DEFAULT_TEXT_STROKE_COLOR = "#ffffff";
const DEFAULT_TEXT_SHADOW_COLOR = "#000000";

function normalizeNumber(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function sanitizeHexColor(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(trimmed) ? trimmed : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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

function getImageSourceRectWithCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  cropScale: number,
  cropX: number,
  cropY: number,
) {
  const base = getCoverSourceRect(sourceWidth, sourceHeight, targetWidth, targetHeight);
  const safeScale = clamp(cropScale, 1, 6);
  const normalizedX = clamp(cropX, -100, 100) / 100;
  const normalizedY = clamp(cropY, -100, 100) / 100;
  const zoomedWidth = Math.max(1, base.sw / safeScale);
  const zoomedHeight = Math.max(1, base.sh / safeScale);
  const shiftRangeX = Math.max(0, (base.sw - zoomedWidth) / 2);
  const shiftRangeY = Math.max(0, (base.sh - zoomedHeight) / 2);
  const centerX = base.sx + base.sw / 2 - normalizedX * shiftRangeX;
  const centerY = base.sy + base.sh / 2 - normalizedY * shiftRangeY;
  const minSx = base.sx;
  const maxSx = base.sx + base.sw - zoomedWidth;
  const minSy = base.sy;
  const maxSy = base.sy + base.sh - zoomedHeight;
  const sx = clamp(centerX - zoomedWidth / 2, minSx, maxSx);
  const sy = clamp(centerY - zoomedHeight / 2, minSy, maxSy);
  return {
    sx,
    sy,
    sw: zoomedWidth,
    sh: zoomedHeight,
  };
}

function getImageFilterCss(image: CanvasImageBox) {
  const filterParts: string[] = [];
  const outlineEnabled = image.outlineEnabled === true;
  const outlineWidth = clamp(normalizeNumber(image.outlineWidth ?? 0, 0), 0, 20);
  const outlineColor = sanitizeHexColor(image.outlineColor, DEFAULT_IMAGE_OUTLINE_COLOR);

  if (outlineEnabled && outlineWidth > 0) {
    const offset = Math.max(0.5, outlineWidth);
    filterParts.push(`drop-shadow(${offset}px 0 0 ${outlineColor})`);
    filterParts.push(`drop-shadow(${-offset}px 0 0 ${outlineColor})`);
    filterParts.push(`drop-shadow(0 ${offset}px 0 ${outlineColor})`);
    filterParts.push(`drop-shadow(0 ${-offset}px 0 ${outlineColor})`);
    if (outlineWidth > 1.2) {
      filterParts.push(`drop-shadow(${offset}px ${offset}px 0 ${outlineColor})`);
      filterParts.push(`drop-shadow(${-offset}px ${offset}px 0 ${outlineColor})`);
      filterParts.push(`drop-shadow(${offset}px ${-offset}px 0 ${outlineColor})`);
      filterParts.push(`drop-shadow(${-offset}px ${-offset}px 0 ${outlineColor})`);
    }
  }

  if (image.shadowEnabled) {
    const shadowColor = sanitizeHexColor(image.shadowColor, DEFAULT_IMAGE_SHADOW_COLOR);
    const shadowBlur = clamp(normalizeNumber(image.shadowBlur ?? 0, 0), 0, 64);
    const shadowOffsetX = clamp(normalizeNumber(image.shadowOffsetX ?? 0, 0), -80, 80);
    const shadowOffsetY = clamp(normalizeNumber(image.shadowOffsetY ?? 0, 0), -80, 80);
    filterParts.push(`drop-shadow(${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor})`);
  }

  const edgeSoftness = clamp(normalizeNumber(image.edgeSoftness ?? 0, 0), 0, 8);
  if (edgeSoftness > 0) {
    filterParts.push(`blur(${edgeSoftness}px)`);
  }

  return filterParts.length > 0 ? filterParts.join(" ") : "none";
}

function normalizeTextTransform(value: string | undefined): "none" | "uppercase" | "lowercase" | "capitalize" {
  if (value === "uppercase" || value === "lowercase" || value === "capitalize") return value;
  return "none";
}

function applyTextTransform(value: string, mode: "none" | "uppercase" | "lowercase" | "capitalize") {
  if (mode === "uppercase") return value.toUpperCase();
  if (mode === "lowercase") return value.toLowerCase();
  if (mode === "capitalize") {
    return value.replace(/\b([a-z])/gi, (match) => match.toUpperCase());
  }
  return value;
}

function measureTextWidthWithLetterSpacing(ctx: CanvasRenderingContext2D, text: string, letterSpacing: number) {
  const chars = Array.from(text || "");
  if (chars.length === 0) return 0;
  let width = 0;
  for (const char of chars) {
    width += ctx.measureText(char).width;
  }
  width += letterSpacing * Math.max(0, chars.length - 1);
  return width;
}

function drawTextLineWithLetterSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  align: "left" | "center" | "right",
  boxWidth: number,
  letterSpacing: number,
  strokeEnabled: boolean,
  strokeColor: string,
  strokeWidth: number,
) {
  const chars = Array.from(text || "");
  if (!chars.length) return;

  const lineWidth = measureTextWidthWithLetterSpacing(ctx, text, letterSpacing);
  let startX = x;
  if (align === "center") {
    startX = (boxWidth - lineWidth) / 2;
  } else if (align === "right") {
    startX = boxWidth - lineWidth;
  }

  let penX = startX;
  for (const char of chars) {
    if (strokeEnabled && strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(char, penX, y);
    }
    ctx.fillText(char, penX, y);
    penX += ctx.measureText(char).width + letterSpacing;
  }
}

function drawCurvedTextLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  baselineY: number,
  boxWidth: number,
  curveAmount: number,
  letterSpacing: number,
  align: "left" | "center" | "right",
  strokeEnabled: boolean,
  strokeColor: string,
  strokeWidth: number,
) {
  const chars = Array.from(text || "");
  if (!chars.length) return;
  const lineWidth = measureTextWidthWithLetterSpacing(ctx, text, letterSpacing);

  let startX = 0;
  if (align === "center") {
    startX = (boxWidth - lineWidth) / 2;
  } else if (align === "right") {
    startX = boxWidth - lineWidth;
  }

  const amplitude = curveAmount * 0.5;
  let penX = startX;
  for (const char of chars) {
    const charWidth = ctx.measureText(char).width;
    const centerX = penX + charWidth / 2;
    const t = (centerX - boxWidth / 2) / Math.max(1, boxWidth / 2);
    const y = baselineY - amplitude * (1 - t * t);
    const slope = (4 * amplitude * t) / Math.max(1, boxWidth);
    const angle = Math.atan(slope);

    ctx.save();
    ctx.translate(centerX, y);
    ctx.rotate(angle);

    if (strokeEnabled && strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(char, -charWidth / 2, 0);
    }
    ctx.fillText(char, -charWidth / 2, 0);
    ctx.restore();

    penX += charWidth + letterSpacing;
  }
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
      // Small tolerance avoids false wraps from sub-pixel/measurement variance.
      const fits = ctx.measureText(candidate).width <= maxWidth + 1.5;

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

function containsMyanmarText(value: string) {
  return /[\u1000-\u109F\uA9E0-\uA9FF\uAA60-\uAA7F]/.test(value);
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
      const imageCropScale = clamp(normalizeNumber(imageBox.cropScale ?? 1, 1), 1, 6);
      const imageCropX = clamp(normalizeNumber(imageBox.cropX ?? 0, 0), -100, 100);
      const imageCropY = clamp(normalizeNumber(imageBox.cropY ?? 0, 0), -100, 100);
      const imageBackgroundColor = sanitizeHexColor(imageBox.backgroundColor, DEFAULT_IMAGE_BACKGROUND_COLOR);
      const imageBackgroundOpacity = Math.max(0, Math.min(1, normalizeNumber(imageBox.backgroundImageOpacity ?? 1, 1)));
      const imageFilter = getImageFilterCss(imageBox);

      try {
        const image = await loadImage(imageBox.src);
        ctx.save();
        ctx.globalAlpha = imageOpacity;
        ctx.translate(imageX + imageWidth / 2, imageY + imageHeight / 2);
        ctx.rotate((imageRotation * Math.PI) / 180);
        if (imageBackgroundColor) {
          ctx.fillStyle = imageBackgroundColor;
          ctx.fillRect(-imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
        }

        if (imageBox.backgroundImageSrc) {
          try {
            const backgroundImage = await loadImage(imageBox.backgroundImageSrc);
            const backgroundRect = getCoverSourceRect(
              backgroundImage.naturalWidth || backgroundImage.width,
              backgroundImage.naturalHeight || backgroundImage.height,
              imageWidth,
              imageHeight,
            );
            const originalAlpha = ctx.globalAlpha;
            ctx.globalAlpha = originalAlpha * imageBackgroundOpacity;
            ctx.drawImage(
              backgroundImage,
              backgroundRect.sx,
              backgroundRect.sy,
              backgroundRect.sw,
              backgroundRect.sh,
              -imageWidth / 2,
              -imageHeight / 2,
              imageWidth,
              imageHeight,
            );
            ctx.globalAlpha = originalAlpha;
          } catch {
            // Ignore missing/invalid background image and continue with foreground render.
          }
        }

        const sourceRect = getImageSourceRectWithCrop(
          image.naturalWidth || image.width,
          image.naturalHeight || image.height,
          imageWidth,
          imageHeight,
          imageCropScale,
          imageCropX,
          imageCropY,
        );
        ctx.filter = imageFilter;
        ctx.drawImage(image, sourceRect.sx, sourceRect.sy, sourceRect.sw, sourceRect.sh, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
        ctx.filter = "none";
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
      const squareBleed = 0.75;
      const nearLeftEdge = shapeX <= 1;
      const nearTopEdge = shapeY <= 1;
      const nearRightEdge = Math.abs(shapeX + shapeWidth - width) <= 1.5;
      const nearBottomEdge = Math.abs(shapeY + shapeHeight - height) <= 1.5;

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
        // Small bleed prevents 1px right/bottom seams from subpixel rasterization.
        const bleedLeft = squareBleed + (nearLeftEdge ? 1 : 0);
        const bleedTop = squareBleed + (nearTopEdge ? 1 : 0);
        const bleedRight = squareBleed + (nearRightEdge ? 1 : 0);
        const bleedBottom = squareBleed + (nearBottomEdge ? 1 : 0);
        ctx.rect(
          -shapeWidth / 2 - bleedLeft,
          -shapeHeight / 2 - bleedTop,
          shapeWidth + bleedLeft + bleedRight,
          shapeHeight + bleedTop + bleedBottom,
        );
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
    const letterSpacing = clamp(normalizeNumber(box.letterSpacing ?? 0, 0), -10, 60);
    const textTransform = normalizeTextTransform(box.textTransform);
    const strokeEnabled = box.strokeEnabled === true;
    const strokeColor = sanitizeHexColor(box.strokeColor, DEFAULT_TEXT_STROKE_COLOR);
    const strokeWidth = clamp(normalizeNumber(box.strokeWidth ?? 0, 0), 0, 12);
    const shadowEnabled = box.shadowEnabled === true;
    const shadowColor = sanitizeHexColor(box.shadowColor, DEFAULT_TEXT_SHADOW_COLOR);
    const shadowBlur = clamp(normalizeNumber(box.shadowBlur ?? 0, 0), 0, 64);
    const shadowOffsetX = clamp(normalizeNumber(box.shadowOffsetX ?? 0, 0), -80, 80);
    const shadowOffsetY = clamp(normalizeNumber(box.shadowOffsetY ?? 0, 0), -80, 80);
    const curveEnabled = box.curveEnabled === true;
    const curveAmount = clamp(normalizeNumber(box.curveAmount ?? 0, 0), -100, 100);
    const rotation = normalizeNumber(box.rotation ?? 0, 0);
    const lineHeightMultiplier = Math.max(
      0.8,
      Math.min(3, normalizeNumber(box.lineHeight ?? DEFAULT_TEXT_LINE_HEIGHT, DEFAULT_TEXT_LINE_HEIGHT)),
    );
    const lineHeight = fontSize * lineHeightMultiplier;
    const topLeading = Math.max(0, (lineHeight - fontSize) / 2);

    ctx.save();
    ctx.translate(boxX + boxWidth / 2, boxY + boxHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-boxWidth / 2, -boxHeight / 2);

    ctx.fillStyle = color;
    ctx.font = `${fontWeight} ${fontSize}px "${escapeFontFamily(fontFamily)}", Arial, sans-serif`;
    ctx.textBaseline = "top";
    ctx.textAlign = align;
    ctx.shadowColor = shadowEnabled ? shadowColor : "transparent";
    ctx.shadowBlur = shadowEnabled ? shadowBlur : 0;
    ctx.shadowOffsetX = shadowEnabled ? shadowOffsetX : 0;
    ctx.shadowOffsetY = shadowEnabled ? shadowOffsetY : 0;

    const maxLines = Math.max(1, Math.floor(Math.max(lineHeight, boxHeight - topLeading) / lineHeight));
    const rawText = applyTextTransform(box.text || "", textTransform);
    const lines = (containsMyanmarText(rawText) ? rawText.split(/\r?\n/) : wrapTextLines(ctx, rawText, boxWidth)).slice(0, maxLines);
    const textX = align === "left" ? 0 : align === "center" ? boxWidth / 2 : boxWidth;

    lines.forEach((line, index) => {
      const y = topLeading + index * lineHeight;
      if (curveEnabled) {
        const curveLine = line.replace(/\r?\n+/g, " ");
        drawCurvedTextLine(
          ctx,
          curveLine,
          y + fontSize,
          boxWidth,
          curveAmount,
          letterSpacing,
          align,
          strokeEnabled,
          strokeColor,
          strokeWidth,
        );
        return;
      }

      drawTextLineWithLetterSpacing(
        ctx,
        line,
        textX,
        y,
        align,
        boxWidth,
        letterSpacing,
        strokeEnabled,
        strokeColor,
        strokeWidth,
      );
    });

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.restore();
  }

  return canvas;
}

async function renderElementToCanvas(sourceElement: HTMLElement, page?: ExportDesignPage, scaleOverride?: number) {
  const { default: html2canvas } = await import("html2canvas");
  if (page) {
    await ensureExportFontsLoaded(page.textBoxes);
  }
  if (typeof document !== "undefined" && "fonts" in document) {
    await (document as Document & { fonts: FontFaceSet }).fonts.ready;
  }
  const targetRect = sourceElement.getBoundingClientRect();

  return html2canvas(sourceElement, {
    backgroundColor: null,
    useCORS: true,
    scale: Math.max(1, (scaleOverride ?? window.devicePixelRatio ?? 1)),
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
        sanitizeCloneUnsupportedColors(clonedDoc, clonedCanvas);
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

function resizeCanvasToDisplaySize(source: HTMLCanvasElement, width: number, height: number) {
  const targetWidth = Math.max(1, Math.round(width));
  const targetHeight = Math.max(1, Math.round(height));
  if (source.width === targetWidth && source.height === targetHeight) {
    return source;
  }

  const resized = document.createElement("canvas");
  resized.width = targetWidth;
  resized.height = targetHeight;
  const ctx = resized.getContext("2d");
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0, source.width, source.height, 0, 0, targetWidth, targetHeight);
  return resized;
}

const UNSUPPORTED_COLOR_FUNCTION_RE = /\b(?:oklch|oklab|lch|lab)\(/i;

function sanitizeCloneUnsupportedColors(clonedDoc: Document, root: HTMLElement) {
  const view = clonedDoc.defaultView;
  if (!view) return;

  const probe = clonedDoc.createElement("span");
  probe.style.position = "fixed";
  probe.style.left = "-9999px";
  probe.style.top = "-9999px";
  probe.style.pointerEvents = "none";
  clonedDoc.body.appendChild(probe);

  const toSafeColor = (value: string, fallback: string) => {
    if (!UNSUPPORTED_COLOR_FUNCTION_RE.test(value)) return value;
    probe.style.color = "";
    probe.style.color = value;
    const resolved = view.getComputedStyle(probe).color || "";
    return resolved && !UNSUPPORTED_COLOR_FUNCTION_RE.test(resolved) ? resolved : fallback;
  };

  const colorProps: readonly [string, string][] = [
    ["color", "#0f172a"],
    ["background-color", "transparent"],
    ["border-top-color", "transparent"],
    ["border-right-color", "transparent"],
    ["border-bottom-color", "transparent"],
    ["border-left-color", "transparent"],
    ["outline-color", "transparent"],
    ["text-decoration-color", "#0f172a"],
    ["caret-color", "#0f172a"],
    ["fill", "none"],
    ["stroke", "none"],
    ["stop-color", "#0f172a"],
  ];

  const targets = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];
  for (const node of targets) {
    const computed = view.getComputedStyle(node);
    for (const [prop, fallback] of colorProps) {
      const value = computed.getPropertyValue(prop).trim();
      if (!value || !UNSUPPORTED_COLOR_FUNCTION_RE.test(value)) continue;
      node.style.setProperty(prop, toSafeColor(value, fallback));
    }
  }

  probe.remove();
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
      canvas = await renderElementToCanvas(sourceElement, page);
    } catch (firstError) {
      try {
        // Retry once with a lower scale for memory-constrained devices.
        await new Promise<void>((resolve) => window.setTimeout(resolve, 120));
        canvas = await renderElementToCanvas(sourceElement, page, 1);
      } catch (secondError) {
        console.warn("DOM export capture failed after retry. Falling back to canvas renderer.", { firstError, secondError });
        const rendered = await renderPageToCanvas(page);
        const rect = sourceElement.getBoundingClientRect();
        canvas = resizeCanvasToDisplaySize(rendered, rect.width, rect.height);
      }
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
