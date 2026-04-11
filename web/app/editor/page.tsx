"use client";

import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ChangeEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DesignCanvas, { CanvasImageBox, CanvasTextBox } from "@/components/editor/DesignCanvas";
import { readAuthSession } from "@/lib/auth-session";
import { DEFAULT_PAGE, Orientation, PAGE_PREF_KEY, SavedPagePreference, parseDimension } from "@/lib/page-sizes";
import { exportDesignAsImage, exportDesignAsPdf } from "@/lib/design-export";

type CanvasPage = {
  id: string;
  width: number;
  height: number;
  backgroundColor: string;
  showGrid: boolean;
  imageBoxes: CanvasImageBox[];
  textBoxes: CanvasTextBox[];
};

const THUMBNAIL_MAX_WIDTH = 76;
const THUMBNAIL_MAX_HEIGHT = 108;
const EDITOR_DOC_KEY_PREFIX = "design-editor-doc-v1";

function createPageId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createTextId() {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createImageId() {
  return `i_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toSafeNumber(value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getDocStorageKey(preset: string, width: number, height: number) {
  return `${EDITOR_DOC_KEY_PREFIX}:${preset}:${width}x${height}`;
}

function sanitizeTextBox(input: Partial<CanvasTextBox>, fallbackLayer: number): CanvasTextBox {
  const fontWeight = input.fontWeight === "400" || input.fontWeight === "700" ? input.fontWeight : "700";
  const textAlign =
    input.textAlign === "left" || input.textAlign === "center" || input.textAlign === "right"
      ? input.textAlign
      : "left";

  return {
    id: typeof input.id === "string" ? input.id : createTextId(),
    x: clamp(toSafeNumber(input.x, 30), 0, 5000),
    y: clamp(toSafeNumber(input.y, 30), 0, 5000),
    width: clamp(toSafeNumber(input.width, 260), 120, 5000),
    height: clamp(toSafeNumber(input.height, 90), 48, 5000),
    text: typeof input.text === "string" ? input.text : "New text",
    fontSize: clamp(toSafeNumber(input.fontSize, 42), 8, 220),
    fontWeight,
    textAlign,
    color: typeof input.color === "string" ? input.color : "#0f172a",
    rotation: clamp(toSafeNumber(input.rotation, 0), -180, 180),
    layer: clamp(Math.round(toSafeNumber(input.layer ?? fallbackLayer, fallbackLayer)), 1, 100000),
  };
}

function sanitizeImageBox(input: Partial<CanvasImageBox>, fallbackLayer: number): CanvasImageBox {
  return {
    id: typeof input.id === "string" ? input.id : createImageId(),
    x: clamp(toSafeNumber(input.x, 20), 0, 5000),
    y: clamp(toSafeNumber(input.y, 20), 0, 5000),
    width: clamp(toSafeNumber(input.width, 280), 40, 5000),
    height: clamp(toSafeNumber(input.height, 180), 40, 5000),
    src: typeof input.src === "string" ? input.src : "",
    opacity: clamp(toSafeNumber(input.opacity ?? 1, 1), 0, 1),
    rotation: clamp(toSafeNumber(input.rotation ?? 0, 0), -180, 180),
    layer: clamp(Math.round(toSafeNumber(input.layer ?? fallbackLayer, fallbackLayer)), 1, 100000),
  };
}

function sanitizePage(input: Partial<CanvasPage>, fallbackWidth: number, fallbackHeight: number): CanvasPage {
  const rawImageBoxes = Array.isArray(input.imageBoxes) ? input.imageBoxes : [];
  const rawTextBoxes = Array.isArray(input.textBoxes) ? input.textBoxes : [];
  const imageBoxes = rawImageBoxes
    .map((box, index) => sanitizeImageBox(box, index + 1))
    .filter((box) => Boolean(box.src));
  const textBoxes = rawTextBoxes.map((box, index) => sanitizeTextBox(box, imageBoxes.length + index + 1));
  return {
    id: typeof input.id === "string" ? input.id : createPageId(),
    width: clamp(toSafeNumber(input.width, fallbackWidth), 100, 5000),
    height: clamp(toSafeNumber(input.height, fallbackHeight), 100, 5000),
    backgroundColor: typeof input.backgroundColor === "string" ? input.backgroundColor : "#ffffff",
    showGrid: typeof input.showGrid === "boolean" ? input.showGrid : true,
    imageBoxes,
    textBoxes,
  };
}

type StoredEditorDoc = {
  pages: CanvasPage[];
  activePageId: string;
  selectedTextId: string | null;
  selectedImageId: string | null;
};

function createFallbackEditorDoc(width: number, height: number): StoredEditorDoc {
  const fallbackPage: CanvasPage = {
    id: "p_initial",
    width,
    height,
    backgroundColor: "#ffffff",
    showGrid: true,
    imageBoxes: [],
    textBoxes: [],
  };

  return {
    pages: [fallbackPage],
    activePageId: fallbackPage.id,
    selectedTextId: null,
    selectedImageId: null,
  };
}

function loadInitialEditorDoc(preset: string, width: number, height: number): StoredEditorDoc {
  const fallback = createFallbackEditorDoc(width, height);

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(getDocStorageKey(preset, width, height));
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as Partial<StoredEditorDoc>;
    const sanitizedPages = Array.isArray(parsed.pages)
      ? parsed.pages.map((page) => sanitizePage(page, width, height))
      : [];

    const pages = sanitizedPages.length > 0 ? sanitizedPages : fallback.pages;
    const activePageId =
      typeof parsed.activePageId === "string" && pages.some((p) => p.id === parsed.activePageId)
        ? parsed.activePageId
        : pages[0].id;
    const selectedTextId =
      typeof parsed.selectedTextId === "string" && pages.some((p) => p.textBoxes.some((b) => b.id === parsed.selectedTextId))
        ? parsed.selectedTextId
        : null;
    const selectedImageId =
      typeof parsed.selectedImageId === "string" && pages.some((p) => p.imageBoxes.some((b) => b.id === parsed.selectedImageId))
        ? parsed.selectedImageId
        : null;

    return { pages, activePageId, selectedTextId, selectedImageId };
  } catch {
    return fallback;
  }
}

function EditorPageContent() {
  const searchParams = useSearchParams();

  const label = searchParams.get("label") || DEFAULT_PAGE.label;
  const width = parseDimension(searchParams.get("w"), DEFAULT_PAGE.width);
  const height = parseDimension(searchParams.get("h"), DEFAULT_PAGE.height);
  const orientation: Orientation = searchParams.get("o") === "landscape" ? "landscape" : "portrait";
  const preset = searchParams.get("preset") || "custom";

  const fallbackDoc = useMemo(() => createFallbackEditorDoc(width, height), [height, width]);
  const [initialDoc] = useState<StoredEditorDoc>(() => loadInitialEditorDoc(preset, width, height));
  const [pages, setPages] = useState<CanvasPage[]>(initialDoc.pages);
  const [activePageId, setActivePageId] = useState<string>(initialDoc.activePageId);
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [dragOverPageId, setDragOverPageId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(initialDoc.selectedTextId);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(initialDoc.selectedImageId);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [isPanningCanvas, setIsPanningCanvas] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const panStateRef = useRef<{
    startClientX: number;
    startClientY: number;
    startScrollLeft: number;
    startScrollTop: number;
  } | null>(null);
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const activePage = useMemo<CanvasPage>(() => {
    return (
      pages.find((page) => page.id === activePageId) || {
      id: "__fallback",
      width,
      height,
      backgroundColor: "#ffffff",
      showGrid: true,
      imageBoxes: [],
      textBoxes: [],
    }
  );
  }, [activePageId, height, pages, width]);

  const selectedTextBox = useMemo(() => {
    return activePage.textBoxes.find((box) => box.id === selectedTextId) || null;
  }, [activePage.textBoxes, selectedTextId]);
  const selectedImageBox = useMemo(() => {
    return activePage.imageBoxes.find((box) => box.id === selectedImageId) || null;
  }, [activePage.imageBoxes, selectedImageId]);

  const visiblePages = isHydrated ? pages : fallbackDoc.pages;
  const visibleActivePageId = isHydrated ? activePageId : fallbackDoc.activePageId;
  const visibleActivePage = useMemo<CanvasPage>(() => {
    return (
      visiblePages.find((page) => page.id === visibleActivePageId) || {
      id: "__fallback_visible",
      width,
      height,
      backgroundColor: "#ffffff",
      showGrid: true,
      imageBoxes: [],
      textBoxes: [],
    }
  );
  }, [height, visibleActivePageId, visiblePages, width]);
  const visibleSelectedTextBox = isHydrated ? selectedTextBox : null;
  const visibleSelectedImageBox = isHydrated ? selectedImageBox : null;
  const zoomScale = zoomPercent / 100;
  const filenameBase = useMemo(() => {
    const slug = label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return slug || "design";
  }, [label]);

  const getActivePageLayerBounds = () => {
    const layers = [...activePage.imageBoxes, ...activePage.textBoxes].map((item) =>
      Math.round(toSafeNumber(item.layer ?? 0, 0)),
    );
    if (layers.length === 0) {
      return { min: 0, max: 0 };
    }
    return { min: Math.min(...layers), max: Math.max(...layers) };
  };

  const addPage = () => {
    const source = activePage;
    const newPage: CanvasPage = {
      id: createPageId(),
      width: source.width,
      height: source.height,
      backgroundColor: source.backgroundColor,
      showGrid: source.showGrid,
      imageBoxes: [],
      textBoxes: [],
    };

    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
    setSelectedTextId(null);
    setSelectedImageId(null);
  };

  const duplicatePage = (pageId: string) => {
    const sourceIndex = pages.findIndex((page) => page.id === pageId);
    if (sourceIndex < 0) return;

    const source = pages[sourceIndex];
    const copy: CanvasPage = {
      id: createPageId(),
      width: source.width,
      height: source.height,
      backgroundColor: source.backgroundColor,
      showGrid: source.showGrid,
      imageBoxes: source.imageBoxes.map((box) => ({ ...box, id: createImageId() })),
      textBoxes: source.textBoxes.map((box) => ({ ...box, id: createTextId() })),
    };

    const next = [...pages];
    next.splice(sourceIndex + 1, 0, copy);
    setPages(next);
    setActivePageId(copy.id);
    setSelectedTextId(null);
    setSelectedImageId(null);
  };

  const deletePage = (pageId: string) => {
    if (pages.length <= 1) return;

    const sourceIndex = pages.findIndex((page) => page.id === pageId);
    const next = pages.filter((page) => page.id !== pageId);

    setPages(next);

    if (activePageId === pageId) {
      const fallbackIndex = Math.max(0, sourceIndex - 1);
      setActivePageId(next[fallbackIndex]?.id ?? next[0].id);
      setSelectedTextId(null);
      setSelectedImageId(null);
    }
  };

  const movePage = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    const sourceIndex = pages.findIndex((page) => page.id === sourceId);
    const targetIndex = pages.findIndex((page) => page.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const next = [...pages];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    setPages(next);
  };

  const addTextBox = () => {
    const { max } = getActivePageLayerBounds();
    const newText: CanvasTextBox = {
      id: createTextId(),
      x: Math.max(30, Math.round(activePage.width * 0.2)),
      y: Math.max(30, Math.round(activePage.height * 0.2)),
      width: 420,
      height: 110,
      text: "Add a heading",
      fontSize: 56,
      fontWeight: "700",
      textAlign: "left",
      color: "#0f172a",
      rotation: 0,
      layer: max + 1,
    };

    setPages((prev) =>
      prev.map((page) =>
        page.id === activePage.id ? { ...page, textBoxes: [...page.textBoxes, newText] } : page,
      ),
    );
    setSelectedTextId(newText.id);
    setSelectedImageId(null);
  };

  const addImageFromDataUrl = (src: string, naturalWidth: number, naturalHeight: number) => {
    if (!src) return;
    const { max } = getActivePageLayerBounds();

    const maxW = Math.max(80, activePage.width * 0.7);
    const maxH = Math.max(80, activePage.height * 0.7);
    const rawW = naturalWidth > 0 ? naturalWidth : 800;
    const rawH = naturalHeight > 0 ? naturalHeight : 600;
    const scale = Math.min(maxW / rawW, maxH / rawH, 1);

    const boxWidth = Math.max(80, Math.round(rawW * scale));
    const boxHeight = Math.max(80, Math.round(rawH * scale));
    const newImage: CanvasImageBox = {
      id: createImageId(),
      x: Math.max(10, Math.round((activePage.width - boxWidth) * 0.5)),
      y: Math.max(10, Math.round((activePage.height - boxHeight) * 0.35)),
      width: boxWidth,
      height: boxHeight,
      src,
      opacity: 1,
      rotation: 0,
      layer: max + 1,
    };

    setPages((prev) =>
      prev.map((page) =>
        page.id === activePage.id ? { ...page, imageBoxes: [...page.imageBoxes, newImage] } : page,
      ),
    );
    setSelectedImageId(newImage.id);
    setSelectedTextId(null);
  };

  const handleImageInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!file || !file.type.startsWith("image/")) return;

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(new Error("Unable to read image file."));
        reader.readAsDataURL(file);
      });

      const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth || 0, height: img.naturalHeight || 0 });
        img.onerror = () => resolve({ width: 0, height: 0 });
        img.src = dataUrl;
      });

      addImageFromDataUrl(dataUrl, dimensions.width, dimensions.height);
    } catch {
      setExportError("Unable to insert image.");
    }
  };

  const updateImageBox = (imageId: string, updates: Partial<CanvasImageBox>) => {
    setPages((prev) =>
      prev.map((page) =>
        page.id === activePage.id
          ? {
              ...page,
              imageBoxes: page.imageBoxes.map((box) => (box.id === imageId ? { ...box, ...updates } : box)),
            }
          : page,
      ),
    );
  };

  const updateSelectedImageBox = (updates: Partial<CanvasImageBox>) => {
    if (!selectedImageBox) return;
    updateImageBox(selectedImageBox.id, updates);
  };

  const reorderActiveElement = (target: { type: "image" | "text"; id: string }, position: "front" | "back") => {
    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== activePage.id) return page;

        const combined = [
          ...page.imageBoxes.map((box) => ({
            type: "image" as const,
            id: box.id,
            layer: Math.round(toSafeNumber(box.layer ?? 1, 1)),
          })),
          ...page.textBoxes.map((box) => ({
            type: "text" as const,
            id: box.id,
            layer: Math.round(toSafeNumber(box.layer ?? 1, 1)),
          })),
        ].sort((a, b) => a.layer - b.layer);

        const sourceIndex = combined.findIndex((item) => item.type === target.type && item.id === target.id);
        if (sourceIndex < 0) return page;

        const next = [...combined];
        const [moved] = next.splice(sourceIndex, 1);
        if (position === "front") {
          next.push(moved);
        } else {
          next.unshift(moved);
        }

        const layerMap = new Map<string, number>();
        next.forEach((item, index) => {
          layerMap.set(`${item.type}:${item.id}`, index + 1);
        });

        return {
          ...page,
          imageBoxes: page.imageBoxes.map((box) => ({
            ...box,
            layer: layerMap.get(`image:${box.id}`) ?? 1,
          })),
          textBoxes: page.textBoxes.map((box) => ({
            ...box,
            layer: layerMap.get(`text:${box.id}`) ?? 1,
          })),
        };
      }),
    );
  };

  const reorderSelectedImageBox = (position: "front" | "back") => {
    if (!selectedImageBox) return;
    reorderActiveElement({ type: "image", id: selectedImageBox.id }, position);
  };

  const deleteSelectedImageBox = () => {
    if (!selectedImageBox) return;
    setPages((prev) =>
      prev.map((page) =>
        page.id === activePage.id
          ? { ...page, imageBoxes: page.imageBoxes.filter((box) => box.id !== selectedImageBox.id) }
          : page,
      ),
    );
    setSelectedImageId(null);
  };

  const updateTextBox = (textId: string, updates: Partial<CanvasTextBox>) => {
    setPages((prev) =>
      prev.map((page) =>
        page.id === activePage.id
          ? {
              ...page,
              textBoxes: page.textBoxes.map((box) => (box.id === textId ? { ...box, ...updates } : box)),
            }
          : page,
      ),
    );
  };

  const updateSelectedTextBox = (updates: Partial<CanvasTextBox>) => {
    if (!selectedTextBox) return;
    updateTextBox(selectedTextBox.id, updates);
  };

  const reorderSelectedTextBox = (position: "front" | "back") => {
    if (!selectedTextBox) return;
    reorderActiveElement({ type: "text", id: selectedTextBox.id }, position);
  };

  const deleteSelectedTextBox = () => {
    if (!selectedTextBox) return;

    setPages((prev) =>
      prev.map((page) =>
        page.id === activePage.id
          ? { ...page, textBoxes: page.textBoxes.filter((box) => box.id !== selectedTextBox.id) }
          : page,
      ),
    );
    setSelectedTextId(null);
  };

  const updateActivePage = (updates: Partial<CanvasPage>) => {
    setPages((prev) => prev.map((page) => (page.id === activePage.id ? { ...page, ...updates } : page)));
  };

  const handleDownloadImage = async (format: "png" | "jpg") => {
    if (!isHydrated) return;

    const pageNumber = Math.max(1, pages.findIndex((page) => page.id === activePage.id) + 1);

    try {
      setIsExporting(true);
      setExportError(null);
      await exportDesignAsImage(activePage, format, `${filenameBase}-page-${pageNumber}`);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Unable to export image.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!isHydrated) return;

    try {
      setIsExporting(true);
      setExportError(null);
      await exportDesignAsPdf(pages, filenameBase);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Unable to export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (!readAuthSession()) {
      window.location.replace("/signin");
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const viewport = canvasViewportRef.current;
      const panState = panStateRef.current;
      if (!viewport || !panState) return;

      const deltaX = event.clientX - panState.startClientX;
      const deltaY = event.clientY - panState.startClientY;
      viewport.scrollLeft = panState.startScrollLeft - deltaX;
      viewport.scrollTop = panState.startScrollTop - deltaY;
    };

    const handleMouseUp = () => {
      panStateRef.current = null;
      setIsPanningCanvas(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!downloadMenuRef.current) return;
      if (!downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!readAuthSession()) return;
    const preference: SavedPagePreference = {
      selectedId: preset,
      customWidth: String(width),
      customHeight: String(height),
      orientation,
      label,
      width,
      height,
    };
    window.localStorage.setItem(PAGE_PREF_KEY, JSON.stringify(preference));
  }, [height, label, orientation, preset, width]);

  useEffect(() => {
    const doc: StoredEditorDoc = {
      pages,
      activePageId,
      selectedTextId,
      selectedImageId,
    };

    window.localStorage.setItem(getDocStorageKey(preset, width, height), JSON.stringify(doc));
  }, [activePageId, height, pages, preset, selectedImageId, selectedTextId, width]);

  return (
    <main className="min-h-screen bg-[linear-gradient(140deg,#f1f5f9_0%,#e2e8f0_35%,#f8fafc_100%)] p-4 text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Editor</p>
            <h1 className="text-lg font-bold">
              {label} Canvas ({width} x {height}px)
            </h1>
            <p className="text-xs text-slate-500 capitalize">{orientation} orientation</p>
            <p className="text-xs text-slate-500">
              {visiblePages.length} page{visiblePages.length > 1 ? "s" : ""}
            </p>
            {exportError && <p className="text-xs text-rose-600">{exportError}</p>}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={addTextBox}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              + Text
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageInputChange}
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              + Image
            </button>
            <button
              type="button"
              onClick={addPage}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              + Add Page
            </button>
            <Link
              href="/setup?pick=1"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100"
            >
              Change Page Size
            </Link>
            <div className="relative" ref={downloadMenuRef}>
              <button
                type="button"
                onClick={() => setIsDownloadMenuOpen((prev) => !prev)}
                disabled={isExporting || !isHydrated}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
                  <path d="M10 2.5v9.5" strokeLinecap="round" />
                  <path d="m6.5 9.5 3.5 3.5 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3.5 15.5h13" strokeLinecap="round" />
                </svg>
                Download
                <svg
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 transition ${isDownloadMenuOpen ? "rotate-180" : ""}`}
                >
                  <path d="m5 7 5 6 5-6H5Z" className="fill-current" />
                </svg>
              </button>

              {isDownloadMenuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsDownloadMenuOpen(false);
                      await handleDownloadImage("png");
                    }}
                    className="block w-full px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Download PNG
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsDownloadMenuOpen(false);
                      await handleDownloadImage("jpg");
                    }}
                    className="block w-full px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Download JPG
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsDownloadMenuOpen(false);
                      await handleDownloadPdf();
                    }}
                    className="block w-full px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Download PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {visibleSelectedTextBox ? (
          <section className="flex h-12 items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
            <p className="mr-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Text</p>
            <label className="shrink-0 flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
              Size
              <input
                type="number"
                min={8}
                max={220}
                value={visibleSelectedTextBox.fontSize ?? 42}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  if (!Number.isFinite(value)) return;
                  updateSelectedTextBox({ fontSize: Math.max(8, Math.min(220, value)) });
                }}
                className="w-14 rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
              />
            </label>
            <button
              type="button"
              onClick={() =>
                updateSelectedTextBox({
                  fontWeight: (visibleSelectedTextBox.fontWeight || "700") === "700" ? "400" : "700",
                })
              }
              className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                (visibleSelectedTextBox.fontWeight || "700") === "700"
                  ? "border-sky-400 bg-sky-50 text-sky-700"
                  : "border-slate-300 bg-white text-slate-700"
              }`}
              title="Bold"
            >
              B
            </button>
            <div className="shrink-0 flex items-center overflow-hidden rounded-md border border-slate-300">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => updateSelectedTextBox({ textAlign: align })}
                  className={`px-2 py-1 text-xs capitalize ${
                    (visibleSelectedTextBox.textAlign || "left") === align
                      ? "bg-sky-50 text-sky-700"
                      : "bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {align[0].toUpperCase()}
                </button>
              ))}
            </div>
            <label className="ml-1 shrink-0 flex items-center gap-1 text-xs text-slate-600">
              Color
              <input
                type="color"
                value={visibleSelectedTextBox.color || "#0f172a"}
                onChange={(event) => updateSelectedTextBox({ color: event.target.value })}
                className="h-7 w-8 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
              />
            </label>
            <label className="shrink-0 flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
              Rotate
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={visibleSelectedTextBox.rotation ?? 0}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  if (!Number.isFinite(value)) return;
                  const clamped = Math.max(-180, Math.min(180, value));
                  updateSelectedTextBox({ rotation: clamped });
                }}
                className="w-24 accent-sky-600"
              />
              <input
                type="number"
                min={-180}
                max={180}
                step={1}
                value={visibleSelectedTextBox.rotation ?? 0}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  if (!Number.isFinite(value)) return;
                  const clamped = Math.max(-180, Math.min(180, value));
                  updateSelectedTextBox({ rotation: clamped });
                }}
                className="w-14 rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
              />
            </label>
            <button
              type="button"
              onClick={() => reorderSelectedTextBox("front")}
              className="shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Bring Front
            </button>
            <button
              type="button"
              onClick={() => reorderSelectedTextBox("back")}
              className="shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Send Back
            </button>
            <button
              type="button"
              onClick={deleteSelectedTextBox}
              className="shrink-0 rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
            >
              Delete
            </button>
          </section>
        ) : visibleSelectedImageBox ? (
          <section className="flex h-12 items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
            <p className="mr-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Image</p>
            <label className="shrink-0 flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
              W
              <input
                type="number"
                min={40}
                max={5000}
                value={Math.round(visibleSelectedImageBox.width)}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  if (!Number.isFinite(value)) return;
                  updateSelectedImageBox({ width: Math.max(40, Math.min(5000, value)) });
                }}
                className="w-16 rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
              />
            </label>
            <label className="shrink-0 flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
              H
              <input
                type="number"
                min={40}
                max={5000}
                value={Math.round(visibleSelectedImageBox.height)}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  if (!Number.isFinite(value)) return;
                  updateSelectedImageBox({ height: Math.max(40, Math.min(5000, value)) });
                }}
                className="w-16 rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
              />
            </label>
            <label className="shrink-0 flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
              Opacity
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round((visibleSelectedImageBox.opacity ?? 1) * 100)}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  if (!Number.isFinite(value)) return;
                  const clamped = Math.max(0, Math.min(100, value));
                  updateSelectedImageBox({ opacity: clamped / 100 });
                }}
                className="w-20 accent-sky-600"
              />
              <span className="w-8 text-right text-[10px] text-slate-500">
                {Math.round((visibleSelectedImageBox.opacity ?? 1) * 100)}%
              </span>
            </label>
            <label className="shrink-0 flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
              Rotate
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={visibleSelectedImageBox.rotation ?? 0}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  if (!Number.isFinite(value)) return;
                  const clamped = Math.max(-180, Math.min(180, value));
                  updateSelectedImageBox({ rotation: clamped });
                }}
                className="w-20 accent-sky-600"
              />
              <input
                type="number"
                min={-180}
                max={180}
                step={1}
                value={visibleSelectedImageBox.rotation ?? 0}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  if (!Number.isFinite(value)) return;
                  const clamped = Math.max(-180, Math.min(180, value));
                  updateSelectedImageBox({ rotation: clamped });
                }}
                className="w-14 rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
              />
            </label>
            <button
              type="button"
              onClick={() => reorderSelectedImageBox("front")}
              className="shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Bring Front
            </button>
            <button
              type="button"
              onClick={() => reorderSelectedImageBox("back")}
              className="shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Send Back
            </button>
            <button
              type="button"
              onClick={deleteSelectedImageBox}
              className="ml-1 shrink-0 rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
            >
              Delete
            </button>
          </section>
        ) : (
          <section className="flex h-12 items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
            <p className="mr-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Page</p>
            <label className="ml-1 shrink-0 flex items-center gap-1 text-xs text-slate-600">
              Color
              <input
                type="color"
                value={visibleActivePage.backgroundColor || "#ffffff"}
                onChange={(event) => updateActivePage({ backgroundColor: event.target.value })}
                className="h-7 w-8 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
              />
            </label>
            <button
              type="button"
              onClick={() => updateActivePage({ showGrid: !visibleActivePage.showGrid })}
              className={`ml-2 shrink-0 rounded-md border px-2 py-1 text-xs font-medium ${
                visibleActivePage.showGrid
                  ? "border-sky-400 bg-sky-50 text-sky-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Grid {visibleActivePage.showGrid ? "Visible" : "Hidden"}
            </button>
            <div className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-300 bg-white p-1">
              <button
                type="button"
                onClick={() => setZoomPercent((prev) => clamp(prev - 10, 20, 300))}
                className="h-6 w-6 rounded border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                title="Zoom out"
              >
                -
              </button>
              <span className="min-w-12 text-center text-xs font-semibold text-slate-700">{zoomPercent}%</span>
              <button
                type="button"
                onClick={() => setZoomPercent((prev) => clamp(prev + 10, 20, 300))}
                className="h-6 w-6 rounded border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                title="Zoom in"
              >
                +
              </button>
            </div>
          </section>
        )}

        <section className="min-h-[calc(100vh-120px)] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-4">
          <div className="flex h-[calc(100vh-160px)] gap-4">
            <div
              ref={canvasViewportRef}
              className={`flex-1 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-5 ${
                isPanningCanvas ? "cursor-grabbing" : "cursor-grab"
              }`}
              onMouseDown={(event) => {
                if (event.button !== 0) return;
                const target = event.target as Element | null;
                if (!target) return;

                // Don't pan when interacting with form controls or selected design elements.
                if (target.closest("input, textarea, button, a, label, [data-canvas-element='true']")) {
                  return;
                }

                const viewport = canvasViewportRef.current;
                if (!viewport) return;

                panStateRef.current = {
                  startClientX: event.clientX,
                  startClientY: event.clientY,
                  startScrollLeft: viewport.scrollLeft,
                  startScrollTop: viewport.scrollTop,
                };
                setIsPanningCanvas(true);
                event.preventDefault();
              }}
            >
              <div
                className="mx-auto"
                style={{
                  width: Math.max(1, Math.round(visibleActivePage.width * zoomScale)),
                  height: Math.max(1, Math.round(visibleActivePage.height * zoomScale)),
                }}
              >
                <div
                  style={{
                    width: visibleActivePage.width,
                    height: visibleActivePage.height,
                    transform: `scale(${zoomScale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <DesignCanvas
                    width={visibleActivePage.width}
                    height={visibleActivePage.height}
                    zoom={zoomScale}
                    backgroundColor={visibleActivePage.backgroundColor}
                    showGrid={visibleActivePage.showGrid}
                    imageBoxes={visibleActivePage.imageBoxes}
                    selectedImageId={isHydrated ? selectedImageId : null}
                    onSelectImage={setSelectedImageId}
                    onUpdateImageBox={updateImageBox}
                    textBoxes={visibleActivePage.textBoxes}
                    selectedTextId={isHydrated ? selectedTextId : null}
                    onSelectText={(id) => {
                      setSelectedTextId(id);
                      if (id) setSelectedImageId(null);
                    }}
                    onUpdateTextBox={updateTextBox}
                  />
                </div>
              </div>
            </div>

            <aside className="w-28 shrink-0 overflow-auto rounded-xl border border-slate-200 bg-white p-2">
              <div className="flex flex-col items-center gap-3">
                {visiblePages.map((page, index) => {
                  const thumbScale = Math.min(THUMBNAIL_MAX_WIDTH / page.width, THUMBNAIL_MAX_HEIGHT / page.height);
                  const thumbWidth = Math.max(18, Math.round(page.width * thumbScale));
                  const thumbHeight = Math.max(18, Math.round(page.height * thumbScale));
                  const isActive = page.id === visibleActivePageId;

                  return (
                    <div key={page.id} className="w-full">
                      <button
                        type="button"
                        draggable
                        onDragStart={(event) => {
                          setDraggedPageId(page.id);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragOverPageId(page.id);
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (draggedPageId) {
                            movePage(draggedPageId, page.id);
                          }
                          setDraggedPageId(null);
                          setDragOverPageId(null);
                        }}
                        onDragEnd={() => {
                          setDraggedPageId(null);
                          setDragOverPageId(null);
                        }}
                        onClick={() => {
                          setActivePageId(page.id);
                          setSelectedTextId(null);
                          setSelectedImageId(null);
                        }}
                        aria-label={`Open page ${index + 1}`}
                        title={`Page ${index + 1}`}
                        className={`group flex w-full justify-center rounded-lg border p-2 transition ${
                          isActive ? "border-sky-500 bg-sky-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        } ${dragOverPageId === page.id ? "ring-2 ring-sky-300" : ""}`}
                      >
                        <span
                          className="relative block overflow-hidden border border-slate-300 shadow-sm"
                          style={{ width: thumbWidth, height: thumbHeight, backgroundColor: page.backgroundColor || "#ffffff" }}
                        >
                          {page.showGrid && (
                            <span
                              className="pointer-events-none absolute inset-0 opacity-25"
                              style={{
                                backgroundImage:
                                  "linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)",
                                backgroundSize: `${Math.max(4, Math.round(24 * thumbScale))}px ${Math.max(4, Math.round(24 * thumbScale))}px`,
                              }}
                            />
                          )}
                          {page.imageBoxes.map((image) => {
                            const previewX = Math.max(0, toSafeNumber(image.x, 0) * thumbScale);
                            const previewY = Math.max(0, toSafeNumber(image.y, 0) * thumbScale);
                            const previewWidth = Math.max(2, toSafeNumber(image.width, 280) * thumbScale);
                            const previewHeight = Math.max(2, toSafeNumber(image.height, 180) * thumbScale);
                            const previewOpacity = clamp(toSafeNumber(image.opacity ?? 1, 1), 0, 1);
                            const previewRotation = clamp(toSafeNumber(image.rotation ?? 0, 0), -180, 180);

                            return (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={image.id}
                                src={image.src}
                                alt=""
                                className="pointer-events-none absolute object-cover"
                                style={{
                                  left: previewX,
                                  top: previewY,
                                  width: previewWidth,
                                  height: previewHeight,
                                  opacity: previewOpacity,
                                  transform: `rotate(${previewRotation}deg)`,
                                  transformOrigin: "center center",
                                  zIndex: Math.round(toSafeNumber(image.layer ?? 0, 0)),
                                }}
                              />
                            );
                          })}
                          {page.textBoxes.map((box) => {
                            const previewX = Math.max(0, toSafeNumber(box.x, 0) * thumbScale);
                            const previewY = Math.max(0, toSafeNumber(box.y, 0) * thumbScale);
                            const previewWidth = Math.max(2, toSafeNumber(box.width, 260) * thumbScale);
                            const previewHeight = Math.max(2, toSafeNumber(box.height, 90) * thumbScale);
                            const previewFontSize = Math.max(2, toSafeNumber(box.fontSize ?? 42, 42) * thumbScale);
                            const previewRotation = clamp(toSafeNumber(box.rotation ?? 0, 0), -180, 180);

                            return (
                              <span
                                key={box.id}
                                className="absolute block overflow-hidden whitespace-pre-wrap break-words leading-tight"
                                style={{
                                  left: previewX,
                                  top: previewY,
                                  width: previewWidth,
                                  height: previewHeight,
                                  fontSize: previewFontSize,
                                  fontWeight: box.fontWeight || "700",
                                  textAlign: box.textAlign || "left",
                                  color: box.color || "#0f172a",
                                  transform: `rotate(${previewRotation}deg)`,
                                  transformOrigin: "center center",
                                  lineHeight: 1.2,
                                  zIndex: Math.round(toSafeNumber(box.layer ?? 0, 0)),
                                }}
                              >
                                {box.text}
                              </span>
                            );
                          })}
                        </span>
                      </button>

                      <div className="mt-1 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => duplicatePage(page.id)}
                          aria-label={`Duplicate page ${index + 1}`}
                          className="rounded border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-100"
                          title="Duplicate page"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePage(page.id)}
                          disabled={visiblePages.length <= 1}
                          aria-label={`Delete page ${index + 1}`}
                          className="rounded border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                          title={visiblePages.length <= 1 ? "At least one page is required" : "Delete page"}
                        >
                          Del
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" />}>
      <EditorPageContent />
    </Suspense>
  );
}
