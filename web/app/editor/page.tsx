"use client";

import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DesignCanvas, { CanvasTextBox } from "@/components/editor/DesignCanvas";
import { readAuthSession } from "@/lib/auth-session";
import { DEFAULT_PAGE, Orientation, PAGE_PREF_KEY, SavedPagePreference, parseDimension } from "@/lib/page-sizes";

type CanvasPage = {
  id: string;
  width: number;
  height: number;
  backgroundColor: string;
  showGrid: boolean;
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

function sanitizeTextBox(input: Partial<CanvasTextBox>): CanvasTextBox {
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
  };
}

function sanitizePage(input: Partial<CanvasPage>, fallbackWidth: number, fallbackHeight: number): CanvasPage {
  const rawTextBoxes = Array.isArray(input.textBoxes) ? input.textBoxes : [];
  return {
    id: typeof input.id === "string" ? input.id : createPageId(),
    width: clamp(toSafeNumber(input.width, fallbackWidth), 100, 5000),
    height: clamp(toSafeNumber(input.height, fallbackHeight), 100, 5000),
    backgroundColor: typeof input.backgroundColor === "string" ? input.backgroundColor : "#ffffff",
    showGrid: typeof input.showGrid === "boolean" ? input.showGrid : true,
    textBoxes: rawTextBoxes.map((box) => sanitizeTextBox(box)),
  };
}

type StoredEditorDoc = {
  pages: CanvasPage[];
  activePageId: string;
  selectedTextId: string | null;
};

function createFallbackEditorDoc(width: number, height: number): StoredEditorDoc {
  const fallbackPage: CanvasPage = {
    id: "p_initial",
    width,
    height,
    backgroundColor: "#ffffff",
    showGrid: true,
    textBoxes: [],
  };

  return {
    pages: [fallbackPage],
    activePageId: fallbackPage.id,
    selectedTextId: null,
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

    return { pages, activePageId, selectedTextId };
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
      textBoxes: [],
    }
  );
  }, [activePageId, height, pages, width]);

  const selectedTextBox = useMemo(() => {
    return activePage.textBoxes.find((box) => box.id === selectedTextId) || null;
  }, [activePage.textBoxes, selectedTextId]);

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
      textBoxes: [],
    }
  );
  }, [height, visibleActivePageId, visiblePages, width]);
  const visibleSelectedTextBox = isHydrated ? selectedTextBox : null;

  const addPage = () => {
    const source = activePage;
    const newPage: CanvasPage = {
      id: createPageId(),
      width: source.width,
      height: source.height,
      backgroundColor: source.backgroundColor,
      showGrid: source.showGrid,
      textBoxes: [],
    };

    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
    setSelectedTextId(null);
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
      textBoxes: source.textBoxes.map((box) => ({ ...box, id: createTextId() })),
    };

    const next = [...pages];
    next.splice(sourceIndex + 1, 0, copy);
    setPages(next);
    setActivePageId(copy.id);
    setSelectedTextId(null);
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
    };

    setPages((prev) =>
      prev.map((page) =>
        page.id === activePage.id ? { ...page, textBoxes: [...page.textBoxes, newText] } : page,
      ),
    );
    setSelectedTextId(newText.id);
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

  const updateActivePage = (updates: Partial<CanvasPage>) => {
    setPages((prev) => prev.map((page) => (page.id === activePage.id ? { ...page, ...updates } : page)));
  };

  useEffect(() => {
    if (!readAuthSession()) {
      window.location.replace("/signin");
    }
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
    };

    window.localStorage.setItem(getDocStorageKey(preset, width, height), JSON.stringify(doc));
  }, [activePageId, height, pages, preset, selectedTextId, width]);

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
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addTextBox}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              + Text
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
          </section>
        )}

        <section className="min-h-[calc(100vh-120px)] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-4">
          <div className="flex h-[calc(100vh-160px)] gap-4">
            <div className="flex-1 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-5">
              <DesignCanvas
                width={visibleActivePage.width}
                height={visibleActivePage.height}
                backgroundColor={visibleActivePage.backgroundColor}
                showGrid={visibleActivePage.showGrid}
                textBoxes={visibleActivePage.textBoxes}
                selectedTextId={isHydrated ? selectedTextId : null}
                onSelectText={setSelectedTextId}
                onUpdateTextBox={updateTextBox}
              />
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
                        }}
                        aria-label={`Open page ${index + 1}`}
                        title={`Page ${index + 1}`}
                        className={`group flex w-full justify-center rounded-lg border p-2 transition ${
                          isActive ? "border-sky-500 bg-sky-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        } ${dragOverPageId === page.id ? "ring-2 ring-sky-300" : ""}`}
                      >
                        <span
                          className="relative block border border-slate-300 bg-white shadow-sm"
                          style={{ width: thumbWidth, height: thumbHeight }}
                        >
                          {page.textBoxes.length > 0 && (
                            <span className="absolute right-1 top-1 rounded-full bg-slate-700 px-1.5 py-0.5 text-[9px] leading-none text-white">
                              {page.textBoxes.length}
                            </span>
                          )}
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
