"use client";

import { useEffect, useRef, useState } from "react";

export type CanvasTextBox = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize?: number;
  fontWeight?: "400" | "700";
  textAlign?: "left" | "center" | "right";
  color?: string;
  rotation?: number;
};

type DesignCanvasProps = {
  width: number;
  height: number;
  backgroundColor?: string;
  showGrid?: boolean;
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
const DEFAULT_FONT_SIZE = 42;
const DEFAULT_TEXT_COLOR = "#0f172a";

function toFiniteNumber(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
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
  backgroundColor = "#ffffff",
  showGrid = true,
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

  useEffect(() => {
    if (!dragState || resizeState || rotateState) return;

    const handleMouseMove = (event: MouseEvent) => {
      const deltaX = event.clientX - dragState.startClientX;
      const deltaY = event.clientY - dragState.startClientY;

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
  }, [dragState, height, onUpdateTextBox, resizeState, rotateState, width]);

  useEffect(() => {
    if (!resizeState || rotateState) return;

    const MIN_WIDTH = 120;
    const MIN_HEIGHT = 48;

    const handleMouseMove = (event: MouseEvent) => {
      const deltaX = event.clientX - resizeState.startClientX;
      const deltaY = event.clientY - resizeState.startClientY;

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
  }, [height, onUpdateTextBox, resizeState, rotateState, width]);

  useEffect(() => {
    if (!rotateState) return;

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
  }, [onUpdateTextBox, rotateState]);

  return (
    <div
      id="design-canvas"
      ref={canvasRef}
      className="relative mx-auto overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-300/60"
      style={{ width, height, backgroundColor }}
      onMouseDown={(event) => {
        if (event.target === canvasRef.current) {
          onSelectText(null);
        }
        setEditingId(null);
      }}
    >
      {showGrid && (
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
      )}
      <div className="pointer-events-none absolute inset-0 border border-slate-200" />

      {textBoxes.map((box) => {
        const boxX = toFiniteNumber(box.x, 0);
        const boxY = toFiniteNumber(box.y, 0);
        const boxWidth = toFiniteNumber(box.width, DEFAULT_TEXT_BOX_WIDTH);
        const boxHeight = toFiniteNumber(box.height, DEFAULT_TEXT_BOX_HEIGHT);
        const boxFontSize = toFiniteNumber(box.fontSize ?? DEFAULT_FONT_SIZE, DEFAULT_FONT_SIZE);
        const boxColor = box.color || DEFAULT_TEXT_COLOR;
        const boxWeight = box.fontWeight || "700";
        const boxAlign = box.textAlign || "left";
        const boxRotation = normalizeAngle(box.rotation ?? 0);
        const isSelected = selectedTextId === box.id;
        const isEditing = editingId === box.id;

        return (
          <div
            key={box.id}
            className={`absolute rounded border px-1.5 py-1 ${
              isSelected ? "border-sky-500/90 shadow-[0_0_0_1px_rgba(14,165,233,0.35)]" : "border-transparent"
            } ${isEditing ? "cursor-text" : "cursor-move"}`}
            style={{
              left: boxX,
              top: boxY,
              width: boxWidth,
              height: boxHeight,
              transform: `rotate(${boxRotation}deg)`,
              transformOrigin: "center center",
            }}
            onMouseDown={(event) => {
              event.stopPropagation();
              onSelectText(box.id);

              if (isEditing || resizeState || rotateState) return;

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
                    Math.min(height - boxY, event.currentTarget.scrollHeight + 8),
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
                className="h-full w-full resize-none rounded border border-sky-300 bg-white/90 px-1 py-0.5 outline-none ring-sky-300 focus:ring"
                style={{
                  fontSize: boxFontSize,
                  lineHeight: 1.2,
                  fontWeight: boxWeight,
                  textAlign: boxAlign,
                  color: boxColor,
                }}
                autoFocus
              />
            ) : (
              <span
                className="block h-full overflow-hidden whitespace-pre-wrap break-words leading-tight"
                style={{
                  fontSize: boxFontSize,
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
                  }}
                />
              </>
            )}
          </div>
        );
      })}

      {textBoxes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="rounded-md bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
            Click + Text to add a text box
          </p>
        </div>
      )}
    </div>
  );
}
