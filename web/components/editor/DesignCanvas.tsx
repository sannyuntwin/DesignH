"use client";

import { useEffect, useRef, useState } from "react";

export type CanvasTextBox = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: "400" | "700";
  textAlign?: "left" | "center" | "right";
  color?: string;
  rotation?: number;
  layer?: number;
};

export type CanvasImageBox = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  opacity?: number;
  rotation?: number;
  layer?: number;
};

export type CanvasShapeKind = "square" | "circle" | "triangle";

export type CanvasShapeBox = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shapeType: CanvasShapeKind;
  fillColor?: string;
  gradientEnabled?: boolean;
  gradientDirection?: "vertical" | "horizontal";
  gradientColors?: readonly [string, string, string];
  strokeColor?: string;
  strokeWidth?: number;
  rotation?: number;
  layer?: number;
};

type DesignCanvasProps = {
  width: number;
  height: number;
  zoom?: number;
  backgroundColor?: string;
  backgroundGradientEnabled?: boolean;
  backgroundGradientDirection?: "vertical" | "horizontal";
  backgroundGradientColors?: readonly [string, string, string];
  borderWidth?: number;
  borderColor?: string;
  borderGradientEnabled?: boolean;
  borderGradientDirection?: "vertical" | "horizontal";
  borderGradientColors?: readonly [string, string, string];
  showGrid?: boolean;
  imageBoxes: CanvasImageBox[];
  selectedImageId: string | null;
  onSelectImage: (id: string | null) => void;
  onUpdateImageBox: (id: string, updates: Partial<CanvasImageBox>) => void;
  shapeBoxes: CanvasShapeBox[];
  selectedShapeId: string | null;
  onSelectShape: (id: string | null) => void;
  onUpdateShapeBox: (id: string, updates: Partial<CanvasShapeBox>) => void;
  textBoxes: CanvasTextBox[];
  selectedTextId: string | null;
  onSelectText: (id: string | null) => void;
  onUpdateTextBox: (id: string, updates: Partial<CanvasTextBox>) => void;
};

type DragState = {
  id: string;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  boxWidth: number;
  boxHeight: number;
};

type ResizeState = {
  id: string;
  startClientX: number;
  startClientY: number;
  startWidth: number;
  startHeight: number;
  x: number;
  y: number;
};

type RotateState = {
  id: string;
  centerX: number;
  centerY: number;
};

const DEFAULT_TEXT_BOX_WIDTH = 260;
const DEFAULT_TEXT_BOX_HEIGHT = 90;
const DEFAULT_FONT_FAMILY = "Arial";
const DEFAULT_FONT_SIZE = 42;
const DEFAULT_TEXT_COLOR = "#0f172a";
const DEFAULT_IMAGE_BOX_WIDTH = 280;
const DEFAULT_IMAGE_BOX_HEIGHT = 180;
const DEFAULT_SHAPE_BOX_WIDTH = 180;
const DEFAULT_SHAPE_BOX_HEIGHT = 180;
const DEFAULT_SHAPE_FILL = "#38bdf8";
const DEFAULT_SHAPE_GRADIENT_COLORS: readonly [string, string, string] = ["#38bdf8", "#22d3ee", "#818cf8"];
const DEFAULT_SHAPE_STROKE = "#0f172a";

function toFiniteNumber(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function sanitizeHexColor(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(trimmed) ? trimmed : fallback;
}

function toFontFamilyCss(value: string) {
  const safe = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${safe}", Arial, sans-serif`;
}

function normalizeAngle(value: number) {
  if (!Number.isFinite(value)) return 0;
  let angle = value;
  while (angle <= -180) angle += 360;
  while (angle > 180) angle -= 360;
  return Math.round(angle);
}

export default function DesignCanvas({
  width,
  height,
  zoom = 1,
  backgroundColor = "#ffffff",
  backgroundGradientEnabled = false,
  backgroundGradientDirection = "vertical",
  backgroundGradientColors = ["#f8fafc", "#e2e8f0", "#cbd5e1"],
  borderWidth = 0,
  borderColor = "#0f172a",
  borderGradientEnabled = false,
  borderGradientDirection = "vertical",
  borderGradientColors = ["#0f172a", "#475569", "#0f172a"],
  showGrid = true,
  imageBoxes,
  selectedImageId,
  onSelectImage,
  onUpdateImageBox,
  shapeBoxes,
  selectedShapeId,
  onSelectShape,
  onUpdateShapeBox,
  textBoxes,
  selectedTextId,
  onSelectText,
  onUpdateTextBox,
}: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [rotateState, setRotateState] = useState<RotateState | null>(null);
  const [imageDragState, setImageDragState] = useState<DragState | null>(null);
  const [imageResizeState, setImageResizeState] = useState<ResizeState | null>(null);
  const [shapeDragState, setShapeDragState] = useState<DragState | null>(null);
  const [shapeResizeState, setShapeResizeState] = useState<ResizeState | null>(null);
  const [shapeRotateState, setShapeRotateState] = useState<RotateState | null>(null);
  const zoomScale = Math.max(0.1, zoom);
  const pageBorderWidth = Math.max(0, toFiniteNumber(borderWidth, 0));
  const [gradientStart, gradientMiddle, gradientEnd] = backgroundGradientColors;
  const [borderGradientStart, borderGradientMiddle, borderGradientEnd] = borderGradientColors;
  const pageBackgroundImage = backgroundGradientEnabled
    ? `linear-gradient(${backgroundGradientDirection === "horizontal" ? "to right" : "to bottom"}, ${sanitizeHexColor(
        gradientStart,
        "#f8fafc",
      )} 0%, ${sanitizeHexColor(gradientMiddle, "#e2e8f0")} 50%, ${sanitizeHexColor(gradientEnd, "#cbd5e1")} 100%)`
    : undefined;
  const pageBorderGradientImage = borderGradientEnabled
    ? `linear-gradient(${borderGradientDirection === "horizontal" ? "to right" : "to bottom"}, ${sanitizeHexColor(
        borderGradientStart,
        "#0f172a",
      )} 0%, ${sanitizeHexColor(borderGradientMiddle, "#475569")} 50%, ${sanitizeHexColor(
        borderGradientEnd,
        "#0f172a",
      )} 100%)`
    : undefined;

  useEffect(() => {
    if (!dragState || resizeState || rotateState || imageDragState || imageResizeState || shapeDragState || shapeResizeState || shapeRotateState) return;

    const handleMouseMove = (event: MouseEvent) => {
      const deltaX = (event.clientX - dragState.startClientX) / zoomScale;
      const deltaY = (event.clientY - dragState.startClientY) / zoomScale;

      const maxX = Math.max(0, width - dragState.boxWidth);
      const maxY = Math.max(0, height - dragState.boxHeight);
      const nextX = Math.max(0, Math.min(maxX, dragState.startX + deltaX));
      const nextY = Math.max(0, Math.min(maxY, dragState.startY + deltaY));

      onUpdateTextBox(dragState.id, { x: nextX, y: nextY });
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    dragState,
    height,
    imageDragState,
    imageResizeState,
    onUpdateTextBox,
    resizeState,
    rotateState,
    shapeDragState,
    shapeResizeState,
    shapeRotateState,
    width,
    zoomScale,
  ]);

  useEffect(() => {
    if (!resizeState || rotateState || imageDragState || imageResizeState || shapeDragState || shapeResizeState || shapeRotateState) return;

    const MIN_WIDTH = 120;
    const MIN_HEIGHT = 48;

    const handleMouseMove = (event: MouseEvent) => {
      const deltaX = (event.clientX - resizeState.startClientX) / zoomScale;
      const deltaY = (event.clientY - resizeState.startClientY) / zoomScale;

      const maxWidth = Math.max(MIN_WIDTH, width - resizeState.x);
      const maxHeight = Math.max(MIN_HEIGHT, height - resizeState.y);

      const nextWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, resizeState.startWidth + deltaX));
      const nextHeight = Math.max(MIN_HEIGHT, Math.min(maxHeight, resizeState.startHeight + deltaY));

      onUpdateTextBox(resizeState.id, { width: nextWidth, height: nextHeight });
    };

    const handleMouseUp = () => {
      setResizeState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    height,
    imageDragState,
    imageResizeState,
    onUpdateTextBox,
    resizeState,
    rotateState,
    shapeDragState,
    shapeResizeState,
    shapeRotateState,
    width,
    zoomScale,
  ]);

  useEffect(() => {
    if (!rotateState || shapeRotateState) return;

    const handleMouseMove = (event: MouseEvent) => {
      const angleDeg = (Math.atan2(event.clientY - rotateState.centerY, event.clientX - rotateState.centerX) * 180) / Math.PI;
      const rotation = normalizeAngle(angleDeg + 90);
      onUpdateTextBox(rotateState.id, { rotation });
    };

    const handleMouseUp = () => {
      setRotateState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onUpdateTextBox, rotateState, shapeRotateState]);

  useEffect(() => {
    if (!imageDragState || imageResizeState || dragState || resizeState || rotateState || shapeDragState || shapeResizeState || shapeRotateState) return;

    const handleMouseMove = (event: MouseEvent) => {
      const deltaX = (event.clientX - imageDragState.startClientX) / zoomScale;
      const deltaY = (event.clientY - imageDragState.startClientY) / zoomScale;

      const maxX = Math.max(0, width - imageDragState.boxWidth);
      const maxY = Math.max(0, height - imageDragState.boxHeight);
      const nextX = Math.max(0, Math.min(maxX, imageDragState.startX + deltaX));
      const nextY = Math.max(0, Math.min(maxY, imageDragState.startY + deltaY));

      onUpdateImageBox(imageDragState.id, { x: nextX, y: nextY });
    };

    const handleMouseUp = () => {
      setImageDragState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    dragState,
    height,
    imageDragState,
    imageResizeState,
    onUpdateImageBox,
    resizeState,
    rotateState,
    shapeDragState,
    shapeResizeState,
    shapeRotateState,
    width,
    zoomScale,
  ]);

  useEffect(() => {
    if (!imageResizeState || imageDragState || dragState || resizeState || rotateState || shapeDragState || shapeResizeState || shapeRotateState) return;

    const MIN_WIDTH = 40;
    const MIN_HEIGHT = 40;

    const handleMouseMove = (event: MouseEvent) => {
      const deltaX = (event.clientX - imageResizeState.startClientX) / zoomScale;
      const deltaY = (event.clientY - imageResizeState.startClientY) / zoomScale;

      const maxWidth = Math.max(MIN_WIDTH, width - imageResizeState.x);
      const maxHeight = Math.max(MIN_HEIGHT, height - imageResizeState.y);

      const nextWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, imageResizeState.startWidth + deltaX));
      const nextHeight = Math.max(MIN_HEIGHT, Math.min(maxHeight, imageResizeState.startHeight + deltaY));

      onUpdateImageBox(imageResizeState.id, { width: nextWidth, height: nextHeight });
    };

    const handleMouseUp = () => {
      setImageResizeState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    dragState,
    height,
    imageDragState,
    imageResizeState,
    onUpdateImageBox,
    resizeState,
    rotateState,
    shapeDragState,
    shapeResizeState,
    shapeRotateState,
    width,
    zoomScale,
  ]);

  useEffect(() => {
    if (!shapeDragState || shapeResizeState || shapeRotateState || dragState || resizeState || rotateState || imageDragState || imageResizeState) return;

    const handleMouseMove = (event: MouseEvent) => {
      const deltaX = (event.clientX - shapeDragState.startClientX) / zoomScale;
      const deltaY = (event.clientY - shapeDragState.startClientY) / zoomScale;

      const maxX = Math.max(0, width - shapeDragState.boxWidth);
      const maxY = Math.max(0, height - shapeDragState.boxHeight);
      const nextX = Math.max(0, Math.min(maxX, shapeDragState.startX + deltaX));
      const nextY = Math.max(0, Math.min(maxY, shapeDragState.startY + deltaY));

      onUpdateShapeBox(shapeDragState.id, { x: nextX, y: nextY });
    };

    const handleMouseUp = () => {
      setShapeDragState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    dragState,
    height,
    imageDragState,
    imageResizeState,
    onUpdateShapeBox,
    resizeState,
    rotateState,
    shapeDragState,
    shapeResizeState,
    shapeRotateState,
    width,
    zoomScale,
  ]);

  useEffect(() => {
    if (!shapeResizeState || shapeDragState || shapeRotateState || dragState || resizeState || rotateState || imageDragState || imageResizeState) return;

    const MIN_WIDTH = 40;
    const MIN_HEIGHT = 40;

    const handleMouseMove = (event: MouseEvent) => {
      const deltaX = (event.clientX - shapeResizeState.startClientX) / zoomScale;
      const deltaY = (event.clientY - shapeResizeState.startClientY) / zoomScale;

      const maxWidth = Math.max(MIN_WIDTH, width - shapeResizeState.x);
      const maxHeight = Math.max(MIN_HEIGHT, height - shapeResizeState.y);

      const nextWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, shapeResizeState.startWidth + deltaX));
      const nextHeight = Math.max(MIN_HEIGHT, Math.min(maxHeight, shapeResizeState.startHeight + deltaY));

      onUpdateShapeBox(shapeResizeState.id, { width: nextWidth, height: nextHeight });
    };

    const handleMouseUp = () => {
      setShapeResizeState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    dragState,
    height,
    imageDragState,
    imageResizeState,
    onUpdateShapeBox,
    resizeState,
    rotateState,
    shapeDragState,
    shapeResizeState,
    shapeRotateState,
    width,
    zoomScale,
  ]);

  useEffect(() => {
    if (!shapeRotateState || rotateState) return;

    const handleMouseMove = (event: MouseEvent) => {
      const angleDeg = (Math.atan2(event.clientY - shapeRotateState.centerY, event.clientX - shapeRotateState.centerX) * 180) / Math.PI;
      const rotation = normalizeAngle(angleDeg + 90);
      onUpdateShapeBox(shapeRotateState.id, { rotation });
    };

    const handleMouseUp = () => {
      setShapeRotateState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onUpdateShapeBox, rotateState, shapeRotateState]);

  return (
    <div
      id="design-canvas"
      ref={canvasRef}
      className="relative mx-auto overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-300/60"
      style={{ width, height, backgroundColor, backgroundImage: pageBackgroundImage }}
      onMouseDown={(event) => {
        if (event.target === canvasRef.current) {
          onSelectText(null);
          onSelectImage(null);
          onSelectShape(null);
        }
        setEditingId(null);
      }}
    >
      {showGrid && (
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
      )}
      <div className="pointer-events-none absolute inset-0 border border-slate-200" />
      {pageBorderWidth > 0 && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            borderStyle: "solid",
            borderWidth: pageBorderWidth,
            borderColor: borderGradientEnabled ? "transparent" : borderColor,
            borderImageSource: pageBorderGradientImage,
            borderImageSlice: borderGradientEnabled ? 1 : undefined,
            boxSizing: "border-box",
          }}
        />
      )}

      {imageBoxes.map((image) => {
        const imageX = toFiniteNumber(image.x, 0);
        const imageY = toFiniteNumber(image.y, 0);
        const imageWidth = Math.max(10, toFiniteNumber(image.width, DEFAULT_IMAGE_BOX_WIDTH));
        const imageHeight = Math.max(10, toFiniteNumber(image.height, DEFAULT_IMAGE_BOX_HEIGHT));
        const imageOpacity = Math.max(0, Math.min(1, toFiniteNumber(image.opacity ?? 1, 1)));
        const imageRotation = normalizeAngle(image.rotation ?? 0);
        const isSelected = selectedImageId === image.id;

        return (
          <div
            key={image.id}
            data-canvas-element="true"
            className={`absolute overflow-hidden rounded border ${
              isSelected ? "border-sky-500/90 shadow-[0_0_0_1px_rgba(14,165,233,0.35)]" : "border-transparent"
            } cursor-move select-none`}
            style={{
              left: imageX,
              top: imageY,
              width: imageWidth,
              height: imageHeight,
              transform: `rotate(${imageRotation}deg)`,
              transformOrigin: "center center",
              opacity: imageOpacity,
              zIndex: Math.round(toFiniteNumber(image.layer ?? 0, 0)),
            }}
            onMouseDown={(event) => {
              event.stopPropagation();
              event.preventDefault();
              onSelectImage(image.id);
              onSelectText(null);
              onSelectShape(null);
              setEditingId(null);
              setDragState(null);
              setResizeState(null);
              setRotateState(null);
              setShapeDragState(null);
              setShapeResizeState(null);
              setShapeRotateState(null);

              if (imageResizeState) return;

              setImageDragState({
                id: image.id,
                startClientX: event.clientX,
                startClientY: event.clientY,
                startX: imageX,
                startY: imageY,
                boxWidth: imageWidth,
                boxHeight: imageHeight,
              });
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.src} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" />

            {isSelected && (
              <button
                type="button"
                aria-label="Resize image"
                className="absolute bottom-0 right-0 h-3 w-3 translate-x-1/2 translate-y-1/2 cursor-se-resize rounded-sm border border-white bg-sky-500 shadow"
                onMouseDown={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  setImageResizeState({
                    id: image.id,
                    startClientX: event.clientX,
                    startClientY: event.clientY,
                    startWidth: imageWidth,
                    startHeight: imageHeight,
                    x: imageX,
                    y: imageY,
                  });
                  setImageDragState(null);
                  setDragState(null);
                  setResizeState(null);
                  setRotateState(null);
                  setShapeDragState(null);
                  setShapeResizeState(null);
                  setShapeRotateState(null);
                }}
              />
            )}
          </div>
        );
      })}

      {shapeBoxes.map((shape) => {
        const shapeX = toFiniteNumber(shape.x, 0);
        const shapeY = toFiniteNumber(shape.y, 0);
        const shapeWidth = Math.max(10, toFiniteNumber(shape.width, DEFAULT_SHAPE_BOX_WIDTH));
        const shapeHeight = Math.max(10, toFiniteNumber(shape.height, DEFAULT_SHAPE_BOX_HEIGHT));
        const shapeRotation = normalizeAngle(shape.rotation ?? 0);
        const shapeType: CanvasShapeKind = shape.shapeType === "circle" || shape.shapeType === "triangle" ? shape.shapeType : "square";
        const fillColor = sanitizeHexColor(shape.fillColor, DEFAULT_SHAPE_FILL);
        const shapeGradientEnabled = Boolean(shape.gradientEnabled);
        const shapeGradientDirection = shape.gradientDirection === "horizontal" ? "horizontal" : "vertical";
        const [shapeGradientStart, shapeGradientMiddle, shapeGradientEnd] = shape.gradientColors || DEFAULT_SHAPE_GRADIENT_COLORS;
        const gradientId = `shape-grad-${shape.id}`;
        const shapeFillValue = shapeGradientEnabled ? `url(#${gradientId})` : fillColor;
        const strokeColor = sanitizeHexColor(shape.strokeColor, DEFAULT_SHAPE_STROKE);
        const strokeWidth = Math.max(0, toFiniteNumber(shape.strokeWidth ?? 2, 2));
        const normalizedStrokeWidth = Math.max(0, (strokeWidth * 100) / Math.max(shapeWidth, shapeHeight));
        const isSelected = selectedShapeId === shape.id;

        return (
          <div
            key={shape.id}
            data-canvas-element="true"
            className={`absolute rounded border ${
              isSelected ? "border-sky-500/90 shadow-[0_0_0_1px_rgba(14,165,233,0.35)]" : "border-transparent"
            } cursor-move select-none`}
            style={{
              left: shapeX,
              top: shapeY,
              width: shapeWidth,
              height: shapeHeight,
              transform: `rotate(${shapeRotation}deg)`,
              transformOrigin: "center center",
              zIndex: Math.round(toFiniteNumber(shape.layer ?? 0, 0)),
            }}
            onMouseDown={(event) => {
              event.stopPropagation();
              event.preventDefault();
              onSelectShape(shape.id);
              onSelectText(null);
              onSelectImage(null);
              setEditingId(null);
              setDragState(null);
              setResizeState(null);
              setRotateState(null);
              setImageDragState(null);
              setImageResizeState(null);

              if (shapeResizeState || shapeRotateState) return;

              setShapeDragState({
                id: shape.id,
                startClientX: event.clientX,
                startClientY: event.clientY,
                startX: shapeX,
                startY: shapeY,
                boxWidth: shapeWidth,
                boxHeight: shapeHeight,
              });
            }}
          >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none h-full w-full overflow-visible">
              {shapeGradientEnabled && (
                <defs>
                  <linearGradient
                    id={gradientId}
                    x1="0%"
                    y1="0%"
                    x2={shapeGradientDirection === "horizontal" ? "100%" : "0%"}
                    y2={shapeGradientDirection === "horizontal" ? "0%" : "100%"}
                  >
                    <stop offset="0%" stopColor={sanitizeHexColor(shapeGradientStart, DEFAULT_SHAPE_GRADIENT_COLORS[0])} />
                    <stop offset="50%" stopColor={sanitizeHexColor(shapeGradientMiddle, DEFAULT_SHAPE_GRADIENT_COLORS[1])} />
                    <stop offset="100%" stopColor={sanitizeHexColor(shapeGradientEnd, DEFAULT_SHAPE_GRADIENT_COLORS[2])} />
                  </linearGradient>
                </defs>
              )}
              {shapeType === "triangle" ? (
                <polygon
                  points="50,0 100,100 0,100"
                  fill={shapeFillValue}
                  stroke={strokeColor}
                  strokeWidth={normalizedStrokeWidth}
                  vectorEffect="non-scaling-stroke"
                />
              ) : shapeType === "circle" ? (
                <ellipse
                  cx="50"
                  cy="50"
                  rx="50"
                  ry="50"
                  fill={shapeFillValue}
                  stroke={strokeColor}
                  strokeWidth={normalizedStrokeWidth}
                  vectorEffect="non-scaling-stroke"
                />
              ) : (
                <rect
                  x="0"
                  y="0"
                  width="100"
                  height="100"
                  fill={shapeFillValue}
                  stroke={strokeColor}
                  strokeWidth={normalizedStrokeWidth}
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>

            {isSelected && (
              <button
                type="button"
                aria-label="Resize shape"
                className="absolute bottom-0 right-0 h-3 w-3 translate-x-1/2 translate-y-1/2 cursor-se-resize rounded-sm border border-white bg-sky-500 shadow"
                onMouseDown={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  setShapeResizeState({
                    id: shape.id,
                    startClientX: event.clientX,
                    startClientY: event.clientY,
                    startWidth: shapeWidth,
                    startHeight: shapeHeight,
                    x: shapeX,
                    y: shapeY,
                  });
                  setShapeDragState(null);
                  setShapeRotateState(null);
                  setDragState(null);
                  setResizeState(null);
                  setRotateState(null);
                  setImageDragState(null);
                  setImageResizeState(null);
                }}
              />
            )}

            {isSelected && (
              <>
                <span className="pointer-events-none absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 -translate-y-full bg-sky-400/80" />
                <button
                  type="button"
                  aria-label="Rotate shape"
                  className="absolute left-1/2 top-0 h-3.5 w-3.5 -translate-x-1/2 -translate-y-[150%] cursor-grab rounded-full border border-white bg-sky-500 shadow active:cursor-grabbing"
                  onMouseDown={(event) => {
                    event.stopPropagation();

                    const rect = event.currentTarget.parentElement?.getBoundingClientRect();
                    if (!rect) return;

                    setShapeRotateState({
                      id: shape.id,
                      centerX: rect.left + rect.width / 2,
                      centerY: rect.top + rect.height / 2,
                    });
                    setShapeDragState(null);
                    setShapeResizeState(null);
                    setDragState(null);
                    setResizeState(null);
                    setRotateState(null);
                    setImageDragState(null);
                    setImageResizeState(null);
                  }}
                />
              </>
            )}
          </div>
        );
      })}

      {textBoxes.map((box) => {
        const boxX = toFiniteNumber(box.x, 0);
        const boxY = toFiniteNumber(box.y, 0);
        const boxWidth = toFiniteNumber(box.width, DEFAULT_TEXT_BOX_WIDTH);
        const boxHeight = toFiniteNumber(box.height, DEFAULT_TEXT_BOX_HEIGHT);
        const boxFontFamily = box.fontFamily || DEFAULT_FONT_FAMILY;
        const boxFontSize = toFiniteNumber(box.fontSize ?? DEFAULT_FONT_SIZE, DEFAULT_FONT_SIZE);
        const boxColor = box.color || DEFAULT_TEXT_COLOR;
        const boxWeight = box.fontWeight || "700";
        const boxAlign = box.textAlign || "left";
        const boxRotation = normalizeAngle(box.rotation ?? 0);
        const textLineHeight = 1.25;
        const isSelected = selectedTextId === box.id;
        const isEditing = editingId === box.id;

        return (
          <div
            key={box.id}
            data-canvas-element="true"
            className={`absolute rounded border ${
              isSelected ? "border-sky-500/90 shadow-[0_0_0_1px_rgba(14,165,233,0.35)]" : "border-transparent"
            } ${isEditing ? "cursor-text" : "cursor-move select-none"}`}
            style={{
              left: boxX,
              top: boxY,
              width: boxWidth,
              height: boxHeight,
              transform: `rotate(${boxRotation}deg)`,
              transformOrigin: "center center",
              zIndex: Math.round(toFiniteNumber(box.layer ?? 0, 0)),
            }}
            onMouseDown={(event) => {
              event.stopPropagation();
              onSelectText(box.id);
              onSelectImage(null);
              onSelectShape(null);

              if (!isEditing) {
                // Prevent browser text highlight while clicking/dragging the box.
                event.preventDefault();
              }

              if (isEditing || resizeState || rotateState || imageDragState || imageResizeState || shapeDragState || shapeResizeState || shapeRotateState) return;

              setDragState({
                id: box.id,
                startClientX: event.clientX,
                startClientY: event.clientY,
                startX: boxX,
                startY: boxY,
                boxWidth,
                boxHeight,
              });
            }}
            onDoubleClick={(event) => {
              event.stopPropagation();
              onSelectText(box.id);
              setEditingId(box.id);
            }}
          >
            {isEditing ? (
              <textarea
                value={box.text}
                onChange={(event) => {
                  const nextText = event.target.value;
                  const nextHeight = Math.max(
                    48,
                    Math.min(height - boxY, event.currentTarget.scrollHeight + 6),
                  );
                  onUpdateTextBox(box.id, { text: nextText, height: nextHeight });
                }}
                onBlur={() => setEditingId(null)}
                onMouseDown={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.currentTarget.blur();
                  }
                }}
                rows={3}
                className="h-full w-full resize-none rounded border border-sky-300 bg-white/90 p-0 outline-none ring-sky-300 focus:ring"
                style={{
                  fontFamily: toFontFamilyCss(boxFontFamily),
                  fontSize: boxFontSize,
                  lineHeight: textLineHeight,
                  fontWeight: boxWeight,
                  textAlign: boxAlign,
                  color: boxColor,
                }}
                autoFocus
              />
            ) : (
              <span
                className="block h-full whitespace-pre-wrap break-words"
                style={{
                  fontFamily: toFontFamilyCss(boxFontFamily),
                  fontSize: boxFontSize,
                  lineHeight: textLineHeight,
                  fontWeight: boxWeight,
                  textAlign: boxAlign,
                  color: boxColor,
                }}
              >
                {box.text || "Double-click to edit"}
              </span>
            )}

            {isSelected && !isEditing && (
              <button
                type="button"
                aria-label="Resize text box"
                className="absolute bottom-0 right-0 h-3 w-3 translate-x-1/2 translate-y-1/2 cursor-se-resize rounded-sm border border-white bg-sky-500 shadow"
                onMouseDown={(event) => {
                  event.stopPropagation();
                  setResizeState({
                    id: box.id,
                    startClientX: event.clientX,
                    startClientY: event.clientY,
                    startWidth: boxWidth,
                    startHeight: boxHeight,
                    x: boxX,
                    y: boxY,
                  });
                  setDragState(null);
                  setRotateState(null);
                  setImageDragState(null);
                  setImageResizeState(null);
                  setShapeDragState(null);
                  setShapeResizeState(null);
                  setShapeRotateState(null);
                }}
              />
            )}

            {isSelected && !isEditing && (
              <>
                <span className="pointer-events-none absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 -translate-y-full bg-sky-400/80" />
                <button
                  type="button"
                  aria-label="Rotate text box"
                  className="absolute left-1/2 top-0 h-3.5 w-3.5 -translate-x-1/2 -translate-y-[150%] cursor-grab rounded-full border border-white bg-sky-500 shadow active:cursor-grabbing"
                  onMouseDown={(event) => {
                    event.stopPropagation();

                    const rect = event.currentTarget.parentElement?.getBoundingClientRect();
                    if (!rect) return;

                    setRotateState({
                      id: box.id,
                      centerX: rect.left + rect.width / 2,
                      centerY: rect.top + rect.height / 2,
                    });
                    setDragState(null);
                    setResizeState(null);
                    setImageDragState(null);
                    setImageResizeState(null);
                    setShapeDragState(null);
                    setShapeResizeState(null);
                    setShapeRotateState(null);
                  }}
                />
              </>
            )}
          </div>
        );
      })}

      {textBoxes.length === 0 && imageBoxes.length === 0 && shapeBoxes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="rounded-md bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
            Click + Text, + Image, or + Shape to add elements
          </p>
        </div>
      )}
    </div>
  );
}
