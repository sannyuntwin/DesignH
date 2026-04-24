"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ChangeEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DesignCanvas, { CanvasImageBox, CanvasShapeBox, CanvasShapeKind, CanvasTextBox } from "@/components/editor/DesignCanvas";
import { readAuthSession } from "@/lib/auth-session";
import { DEFAULT_PAGE, Orientation, PAGE_PREF_KEY, SavedPagePreference, parseDimension } from "@/lib/page-sizes";
import { getEditorTemplate } from "@/lib/editor-templates";
import { updateProjectConfig, upsertProject } from "@/lib/projects";
import { exportDesignAsImage, exportDesignAsPdf } from "@/lib/design-export";
import { createDesign, listDesigns, updateDesign } from "@/lib/designs-api";
import { LOCAL_FONT_FACES, LOCAL_FONT_FAMILIES } from "@/lib/local-fonts";

type CanvasPage = {
  id: string;
  width: number;
  height: number;
  backgroundColor: string;
  gradientEnabled: boolean;
  gradientDirection: "vertical" | "horizontal";
  gradientColors: [string, string, string];
  borderWidth: number;
  borderColor: string;
  borderGradientEnabled: boolean;
  borderGradientDirection: "vertical" | "horizontal";
  borderGradientColors: [string, string, string];
  showGrid: boolean;
  imageBoxes: CanvasImageBox[];
  shapeBoxes: CanvasShapeBox[];
  textBoxes: CanvasTextBox[];
};

const THUMBNAIL_MAX_WIDTH = 76;
const THUMBNAIL_MAX_HEIGHT = 108;
const EDITOR_DOC_KEY_PREFIX = "design-editor-doc-v1";
const EDITOR_DOC_INDEXEDDB_NAME = "design-editor-docs-v1";
const EDITOR_DOC_INDEXEDDB_STORE = "docs";
const CLOUD_DOC_NAME_PREFIX = "design-editor-cloud-v1";
const HISTORY_LIMIT = 80;
const LOCAL_STORAGE_AUTOSAVE_DEBOUNCE_MS = 300;
const INDEXEDDB_AUTOSAVE_DEBOUNCE_MS = 600;
const DEFAULT_GRADIENT_COLORS = ["#f8fafc", "#e2e8f0", "#cbd5e1"] as const;
const DEFAULT_BORDER_GRADIENT_COLORS = ["#0f172a", "#475569", "#0f172a"] as const;
const DEFAULT_SHAPE_GRADIENT_COLORS = ["#38bdf8", "#22d3ee", "#818cf8"] as const;
const SHAPE_KIND_OPTIONS: readonly CanvasShapeKind[] = ["square", "circle", "triangle"];
const BASE_FONT_FAMILY_OPTIONS = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Verdana",
  "Trebuchet MS",
  "Tahoma",
  "Courier New",
  "Impact",
] as const;
const FONT_FAMILY_OPTIONS = mergeFontOptions(BASE_FONT_FAMILY_OPTIONS, LOCAL_FONT_FAMILIES);
const DEFAULT_TEXT_LINE_HEIGHT = 1.25;
type UploadedFontFormat = "woff2" | "woff" | "truetype" | "opentype";
type UploadedFont = {
  family: string;
  source: string;
  format?: UploadedFontFormat;
};

type CopiedElement =
  | { type: "text"; data: CanvasTextBox }
  | { type: "image"; data: CanvasImageBox }
  | { type: "shape"; data: CanvasShapeBox };

type SelectionType = "text" | "image" | "shape";

function createPageId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createTextId() {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createImageId() {
  return `i_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createShapeId() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getPageMaxLayer(page: CanvasPage) {
  const layers = [...page.imageBoxes, ...page.shapeBoxes, ...page.textBoxes].map((item) =>
    Math.round(toSafeNumber(item.layer ?? 0, 0)),
  );
  return layers.length > 0 ? Math.max(...layers) : 0;
}

function cloneStoredDoc(doc: StoredEditorDoc): StoredEditorDoc {
  return JSON.parse(JSON.stringify(doc)) as StoredEditorDoc;
}

function toSafeNumber(value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function applyPartialUpdates<T extends object>(source: T, updates: Partial<T>): T | null {
  let changed = false;
  const next = { ...source } as T;

  for (const key of Object.keys(updates) as (keyof T)[]) {
    const nextValue = updates[key];
    if (!Object.is((source as Record<string, unknown>)[key as string], nextValue)) {
      (next as Record<string, unknown>)[key as string] = nextValue as unknown;
      changed = true;
    }
  }

  return changed ? next : null;
}

function toStorageScope(value: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "default";
}

function getProjectPreferenceKey(projectId: string) {
  return projectId ? `${PAGE_PREF_KEY}:${projectId}` : PAGE_PREF_KEY;
}

function getDocStorageKey(projectScope: string, preset: string, width: number, height: number) {
  return `${EDITOR_DOC_KEY_PREFIX}:${projectScope}:${preset}:${width}x${height}`;
}

function getCloudDocName(projectScope: string, preset: string, width: number, height: number) {
  return `${CLOUD_DOC_NAME_PREFIX}:${projectScope}:${preset}:${width}x${height}`;
}

function sanitizeHexColor(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(trimmed) ? trimmed : fallback;
}

function sanitizeFontName(value: unknown) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return null;
  return cleaned.slice(0, 80);
}

function mergeFontOptions(...groups: readonly (readonly string[] | string[])[]) {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const group of groups) {
    for (const item of group) {
      const font = sanitizeFontName(item);
      if (!font) continue;
      const key = font.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(font);
    }
  }

  return merged;
}

function sanitizeUploadedFonts(value: unknown): UploadedFont[] {
  if (!Array.isArray(value)) return [];

  const next: UploadedFont[] = [];
  const seen = new Set<string>();

  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const family = sanitizeFontName((raw as { family?: unknown }).family);
    const source = typeof (raw as { source?: unknown }).source === "string" ? (raw as { source: string }).source.trim() : "";
    const formatRaw = (raw as { format?: unknown }).format;
    const format =
      formatRaw === "woff2" || formatRaw === "woff" || formatRaw === "truetype" || formatRaw === "opentype"
        ? formatRaw
        : undefined;

    if (!family || !source.startsWith("data:")) continue;
    const key = family.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push({ family, source, format });
  }

  return next;
}

function upsertUploadedFont(existing: UploadedFont[], incoming: UploadedFont) {
  const key = incoming.family.toLowerCase();
  const filtered = existing.filter((font) => font.family.toLowerCase() !== key);
  return [...filtered, incoming];
}

function inferFontFormat(file: File): UploadedFontFormat | undefined {
  const ext = file.name.toLowerCase().split(".").pop();
  if (ext === "woff2") return "woff2";
  if (ext === "woff") return "woff";
  if (ext === "ttf") return "truetype";
  if (ext === "otf") return "opentype";

  const mime = file.type.toLowerCase();
  if (mime.includes("woff2")) return "woff2";
  if (mime.includes("woff")) return "woff";
  if (mime.includes("ttf") || mime.includes("truetype")) return "truetype";
  if (mime.includes("otf") || mime.includes("opentype")) return "opentype";

  return undefined;
}

function escapeCssString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function normalizeFontFamilyKey(value: string) {
  return value.replace(/^['"]+|['"]+$/g, "").trim().toLowerCase();
}

function clearDocumentFontFamily(family: string) {
  if (typeof document === "undefined" || !("fonts" in document)) return;

  const targetFamily = normalizeFontFamilyKey(family);
  if (!targetFamily) return;

  const fontSet = (document as Document & { fonts: FontFaceSet }).fonts;
  for (const fontFace of Array.from(fontSet)) {
    if (normalizeFontFamilyKey(fontFace.family) === targetFamily) {
      fontSet.delete(fontFace);
    }
  }
}

function toFontFamilyCss(value: string) {
  return `"${escapeCssString(value)}", Arial, sans-serif`;
}

function sanitizeGradientColors(value: unknown, fallback: readonly [string, string, string]): [string, string, string] {
  const raw = Array.isArray(value) ? value : [];
  return [
    sanitizeHexColor(raw[0], fallback[0]),
    sanitizeHexColor(raw[1], fallback[1]),
    sanitizeHexColor(raw[2], fallback[2]),
  ];
}

function getPageGradientCss(page: {
  gradientEnabled: boolean;
  gradientDirection: "vertical" | "horizontal";
  gradientColors: [string, string, string];
}) {
  if (!page.gradientEnabled) return undefined;
  const [start, middle, end] = page.gradientColors;
  const direction = page.gradientDirection === "horizontal" ? "to right" : "to bottom";
  return `linear-gradient(${direction}, ${start} 0%, ${middle} 50%, ${end} 100%)`;
}

function getBorderGradientCss(page: {
  borderGradientEnabled: boolean;
  borderGradientDirection: "vertical" | "horizontal";
  borderGradientColors: [string, string, string];
}) {
  if (!page.borderGradientEnabled) return undefined;
  const [start, middle, end] = page.borderGradientColors;
  const direction = page.borderGradientDirection === "horizontal" ? "to right" : "to bottom";
  return `linear-gradient(${direction}, ${start} 0%, ${middle} 50%, ${end} 100%)`;
}

function sanitizeTextBox(input: Partial<CanvasTextBox>, fallbackLayer: number): CanvasTextBox {
  const fontWeight = input.fontWeight === "400" || input.fontWeight === "700" ? input.fontWeight : "700";
  const fontFamily =
    typeof input.fontFamily === "string" && input.fontFamily.trim()
      ? input.fontFamily.trim()
      : FONT_FAMILY_OPTIONS[0];
  const lineHeight = clamp(toSafeNumber(input.lineHeight ?? DEFAULT_TEXT_LINE_HEIGHT, DEFAULT_TEXT_LINE_HEIGHT), 0.8, 3);
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
    fontFamily,
    fontSize: clamp(toSafeNumber(input.fontSize, 42), 8, 220),
    lineHeight,
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

function sanitizeShapeBox(input: Partial<CanvasShapeBox>, fallbackLayer: number): CanvasShapeBox {
  const shapeType: CanvasShapeKind =
    input.shapeType === "circle" || input.shapeType === "triangle" || input.shapeType === "square"
      ? input.shapeType
      : "square";

  return {
    id: typeof input.id === "string" ? input.id : createShapeId(),
    x: clamp(toSafeNumber(input.x, 40), 0, 5000),
    y: clamp(toSafeNumber(input.y, 40), 0, 5000),
    width: clamp(toSafeNumber(input.width, 180), 40, 5000),
    height: clamp(toSafeNumber(input.height, 180), 40, 5000),
    shapeType,
    fillEnabled: input.fillEnabled !== false,
    fillColor: sanitizeHexColor(input.fillColor, "#38bdf8"),
    gradientEnabled: typeof input.gradientEnabled === "boolean" ? input.gradientEnabled : false,
    gradientDirection: input.gradientDirection === "horizontal" ? "horizontal" : "vertical",
    gradientColors: sanitizeGradientColors(input.gradientColors, DEFAULT_SHAPE_GRADIENT_COLORS),
    strokeColor: sanitizeHexColor(input.strokeColor, "#0f172a"),
    strokeWidth: clamp(toSafeNumber(input.strokeWidth ?? 2, 2), 0, 80),
    rotation: clamp(toSafeNumber(input.rotation ?? 0, 0), -180, 180),
    layer: clamp(Math.round(toSafeNumber(input.layer ?? fallbackLayer, fallbackLayer)), 1, 100000),
  };
}

function sanitizePage(input: Partial<CanvasPage>, fallbackWidth: number, fallbackHeight: number): CanvasPage {
  const rawImageBoxes = Array.isArray(input.imageBoxes) ? input.imageBoxes : [];
  const rawShapeBoxes = Array.isArray(input.shapeBoxes) ? input.shapeBoxes : [];
  const rawTextBoxes = Array.isArray(input.textBoxes) ? input.textBoxes : [];
  const imageBoxes = rawImageBoxes
    .map((box, index) => sanitizeImageBox(box, index + 1))
    .filter((box) => Boolean(box.src));
  const shapeBoxes = rawShapeBoxes.map((box, index) => sanitizeShapeBox(box, imageBoxes.length + index + 1));
  const textBoxes = rawTextBoxes.map((box, index) => sanitizeTextBox(box, imageBoxes.length + shapeBoxes.length + index + 1));
  return {
    id: typeof input.id === "string" ? input.id : createPageId(),
    width: clamp(toSafeNumber(input.width, fallbackWidth), 100, 5000),
    height: clamp(toSafeNumber(input.height, fallbackHeight), 100, 5000),
    backgroundColor: sanitizeHexColor(input.backgroundColor, "#ffffff"),
    gradientEnabled: typeof input.gradientEnabled === "boolean" ? input.gradientEnabled : false,
    gradientDirection: input.gradientDirection === "horizontal" ? "horizontal" : "vertical",
    gradientColors: sanitizeGradientColors(input.gradientColors, DEFAULT_GRADIENT_COLORS),
    borderWidth: clamp(toSafeNumber(input.borderWidth, 0), 0, 200),
    borderColor: sanitizeHexColor(input.borderColor, "#0f172a"),
    borderGradientEnabled: typeof input.borderGradientEnabled === "boolean" ? input.borderGradientEnabled : false,
    borderGradientDirection: input.borderGradientDirection === "horizontal" ? "horizontal" : "vertical",
    borderGradientColors: sanitizeGradientColors(input.borderGradientColors, DEFAULT_BORDER_GRADIENT_COLORS),
    showGrid: typeof input.showGrid === "boolean" ? input.showGrid : true,
    imageBoxes,
    shapeBoxes,
    textBoxes,
  };
}

type StoredEditorDoc = {
  pages: CanvasPage[];
  activePageId: string;
  selectedTextId: string | null;
  selectedImageId: string | null;
  selectedShapeId: string | null;
  customFonts: string[];
  uploadedFonts: UploadedFont[];
};

function createFallbackEditorDoc(width: number, height: number, templateId?: string | null): StoredEditorDoc {
  const selectedTemplate = getEditorTemplate(templateId || null);
  const fallbackPage: CanvasPage = {
    id: "p_initial",
    width,
    height,
    backgroundColor: selectedTemplate?.backgroundColor || "#ffffff",
    gradientEnabled: selectedTemplate?.gradientEnabled ?? false,
    gradientDirection: selectedTemplate?.gradientDirection || "vertical",
    gradientColors: selectedTemplate?.gradientColors ? [...selectedTemplate.gradientColors] : [...DEFAULT_GRADIENT_COLORS],
    borderWidth: selectedTemplate?.borderWidth ?? 0,
    borderColor: selectedTemplate?.borderColor || "#0f172a",
    borderGradientEnabled: selectedTemplate?.borderGradientEnabled ?? false,
    borderGradientDirection: selectedTemplate?.borderGradientDirection || "vertical",
    borderGradientColors: selectedTemplate?.borderGradientColors
      ? [...selectedTemplate.borderGradientColors]
      : [...DEFAULT_BORDER_GRADIENT_COLORS],
    showGrid: true,
    imageBoxes: [],
    shapeBoxes: [],
    textBoxes: [],
  };

  return {
    pages: [fallbackPage],
    activePageId: fallbackPage.id,
    selectedTextId: null,
    selectedImageId: null,
    selectedShapeId: null,
    customFonts: [],
    uploadedFonts: [],
  };
}

function sanitizeStoredEditorDoc(input: Partial<StoredEditorDoc>, width: number, height: number, fallback: StoredEditorDoc): StoredEditorDoc {
  const sanitizedPages = Array.isArray(input.pages) ? input.pages.map((page) => sanitizePage(page, width, height)) : [];
  const pages = sanitizedPages.length > 0 ? sanitizedPages : fallback.pages;
  const activePageId = typeof input.activePageId === "string" && pages.some((page) => page.id === input.activePageId) ? input.activePageId : pages[0].id;
  const selectedTextId =
    typeof input.selectedTextId === "string" && pages.some((page) => page.textBoxes.some((box) => box.id === input.selectedTextId))
      ? input.selectedTextId
      : null;
  const selectedImageId =
    typeof input.selectedImageId === "string" && pages.some((page) => page.imageBoxes.some((box) => box.id === input.selectedImageId))
      ? input.selectedImageId
      : null;
  const selectedShapeId =
    typeof input.selectedShapeId === "string" && pages.some((page) => page.shapeBoxes.some((box) => box.id === input.selectedShapeId))
      ? input.selectedShapeId
      : null;
  const customFonts = mergeFontOptions(Array.isArray(input.customFonts) ? input.customFonts : []);
  const uploadedFonts = sanitizeUploadedFonts(input.uploadedFonts);

  return { pages, activePageId, selectedTextId, selectedImageId, selectedShapeId, customFonts, uploadedFonts };
}

function loadInitialEditorDoc(
  projectScope: string,
  preset: string,
  width: number,
  height: number,
  templateId?: string | null,
): StoredEditorDoc {
  const fallback = createFallbackEditorDoc(width, height, templateId);

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(getDocStorageKey(projectScope, preset, width, height));
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as Partial<StoredEditorDoc>;
    return sanitizeStoredEditorDoc(parsed, width, height, fallback);
  } catch {
    return fallback;
  }
}

function openEditorDocDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(EDITOR_DOC_INDEXEDDB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(EDITOR_DOC_INDEXEDDB_STORE)) {
        db.createObjectStore(EDITOR_DOC_INDEXEDDB_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open design cache."));
  });
}

async function readEditorDocFromIndexedDb(storageKey: string): Promise<StoredEditorDoc | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return null;

  let db: IDBDatabase | null = null;
  try {
    db = await openEditorDocDatabase();
    const activeDb = db;
    if (!activeDb) return null;
    const rawValue = await new Promise<unknown>((resolve, reject) => {
      const transaction = activeDb.transaction(EDITOR_DOC_INDEXEDDB_STORE, "readonly");
      const store = transaction.objectStore(EDITOR_DOC_INDEXEDDB_STORE);
      const request = store.get(storageKey);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Unable to read design cache."));
    });

    if (typeof rawValue !== "string") return null;
    return JSON.parse(rawValue) as StoredEditorDoc;
  } catch {
    return null;
  } finally {
    db?.close();
  }
}

async function writeEditorDocToIndexedDb(storageKey: string, payload: string): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;

  let db: IDBDatabase | null = null;
  try {
    db = await openEditorDocDatabase();
    const activeDb = db;
    if (!activeDb) return;
    await new Promise<void>((resolve, reject) => {
      const transaction = activeDb.transaction(EDITOR_DOC_INDEXEDDB_STORE, "readwrite");
      const store = transaction.objectStore(EDITOR_DOC_INDEXEDDB_STORE);
      const request = store.put(payload, storageKey);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("Unable to write design cache."));
    });
  } finally {
    db?.close();
  }
}

function isStorageQuotaExceeded(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybeDom = error as DOMException;
  return (
    maybeDom.name === "QuotaExceededError" ||
    maybeDom.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    maybeDom.code === 22 ||
    maybeDom.code === 1014
  );
}

function pruneEditorDocCache(currentKey: string) {
  if (typeof window === "undefined") return;
  const keysToRemove: string[] = [];

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    if (key.startsWith(`${EDITOR_DOC_KEY_PREFIX}:`) && key !== currentKey) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    window.localStorage.removeItem(key);
  }
}

function EditorPageContent() {
  const searchParams = useSearchParams();

  const projectId = searchParams.get("projectId") || "";
  const projectName = searchParams.get("projectName") || "";
  const templateId = searchParams.get("template");
  const label = searchParams.get("label") || DEFAULT_PAGE.label;
  const width = parseDimension(searchParams.get("w"), DEFAULT_PAGE.width);
  const height = parseDimension(searchParams.get("h"), DEFAULT_PAGE.height);
  const orientation: Orientation = searchParams.get("o") === "landscape" ? "landscape" : "portrait";
  const preset = searchParams.get("preset") || "custom";
  const projectScope = useMemo(
    () => toStorageScope(projectId || projectName || label || `${preset}-${width}x${height}`),
    [height, label, preset, projectId, projectName, width],
  );

  const fallbackDoc = useMemo(() => createFallbackEditorDoc(width, height, templateId), [height, templateId, width]);
  const [initialDoc] = useState<StoredEditorDoc>(() => loadInitialEditorDoc(projectScope, preset, width, height, templateId));
  const [pages, setPages] = useState<CanvasPage[]>(initialDoc.pages);
  const [activePageId, setActivePageId] = useState<string>(initialDoc.activePageId);
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [dragOverPageId, setDragOverPageId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(initialDoc.selectedTextId);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(initialDoc.selectedImageId);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(initialDoc.selectedShapeId);
  const [multiSelectedTextIds, setMultiSelectedTextIds] = useState<string[]>([]);
  const [multiSelectedImageIds, setMultiSelectedImageIds] = useState<string[]>([]);
  const [multiSelectedShapeIds, setMultiSelectedShapeIds] = useState<string[]>([]);
  const [copiedElement, setCopiedElement] = useState<CopiedElement | null>(null);
  const [customFonts, setCustomFonts] = useState<string[]>(initialDoc.customFonts);
  const [uploadedFonts, setUploadedFonts] = useState<UploadedFont[]>(initialDoc.uploadedFonts);
  const [fontInputValue, setFontInputValue] = useState("");
  const [fontManageValue, setFontManageValue] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [, setCloudSyncError] = useState<string | null>(null);
  const [cloudDesignId, setCloudDesignId] = useState<string | null>(null);
  const [isCloudSyncReady, setIsCloudSyncReady] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [isPanningCanvas, setIsPanningCanvas] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fontUploadInputRef = useRef<HTMLInputElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const panStateRef = useRef<{
    startClientX: number;
    startClientY: number;
    startScrollLeft: number;
    startScrollTop: number;
  } | null>(null);
  const undoStackRef = useRef<StoredEditorDoc[]>([]);
  const redoStackRef = useRef<StoredEditorDoc[]>([]);
  const historyReadyRef = useRef(false);
  const previousSnapshotRef = useRef<StoredEditorDoc | null>(null);
  const previousSnapshotKeyRef = useRef("");
  const skipHistoryPushRef = useRef(false);
  const localAutosaveEnabledRef = useRef(true);
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const hasHydratedFromIndexedDbRef = useRef(false);

  const currentDoc = useMemo<StoredEditorDoc>(
    () => ({
      pages,
      activePageId,
      selectedTextId,
      selectedImageId,
      selectedShapeId,
      customFonts,
      uploadedFonts,
    }),
    [activePageId, customFonts, pages, selectedImageId, selectedShapeId, selectedTextId, uploadedFonts],
  );
  const serializedCurrentDoc = useMemo(() => JSON.stringify(currentDoc), [currentDoc]);
  const currentDocRef = useRef(currentDoc);
  useEffect(() => {
    currentDocRef.current = currentDoc;
  }, [currentDoc]);

  const activePage = useMemo<CanvasPage>(() => {
    return (
      pages.find((page) => page.id === activePageId) || {
      id: "__fallback",
      width,
      height,
      backgroundColor: "#ffffff",
      gradientEnabled: false,
      gradientDirection: "vertical",
      gradientColors: [...DEFAULT_GRADIENT_COLORS],
      borderWidth: 0,
      borderColor: "#0f172a",
      borderGradientEnabled: false,
      borderGradientDirection: "vertical",
      borderGradientColors: [...DEFAULT_BORDER_GRADIENT_COLORS],
      showGrid: true,
      imageBoxes: [],
      shapeBoxes: [],
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
  const selectedShapeBox = useMemo(() => {
    return activePage.shapeBoxes.find((box) => box.id === selectedShapeId) || null;
  }, [activePage.shapeBoxes, selectedShapeId]);

  const selectedTextIdsForCanvas = useMemo(() => {
    const ids = new Set<string>(multiSelectedTextIds);
    if (selectedTextId) ids.add(selectedTextId);
    return Array.from(ids);
  }, [multiSelectedTextIds, selectedTextId]);

  const selectedImageIdsForCanvas = useMemo(() => {
    const ids = new Set<string>(multiSelectedImageIds);
    if (selectedImageId) ids.add(selectedImageId);
    return Array.from(ids);
  }, [multiSelectedImageIds, selectedImageId]);

  const selectedShapeIdsForCanvas = useMemo(() => {
    const ids = new Set<string>(multiSelectedShapeIds);
    if (selectedShapeId) ids.add(selectedShapeId);
    return Array.from(ids);
  }, [multiSelectedShapeIds, selectedShapeId]);

  const applySelection = (type: SelectionType, id: string | null, options?: { multi?: boolean }) => {
    if (!id) {
      setSelectedTextId(null);
      setSelectedImageId(null);
      setSelectedShapeId(null);
      setMultiSelectedTextIds([]);
      setMultiSelectedImageIds([]);
      setMultiSelectedShapeIds([]);
      return;
    }

    const multi = Boolean(options?.multi);
    let nextSelectedTextId = selectedTextId;
    let nextSelectedImageId = selectedImageId;
    let nextSelectedShapeId = selectedShapeId;

    const nextTextIds = new Set<string>(multiSelectedTextIds);
    const nextImageIds = new Set<string>(multiSelectedImageIds);
    const nextShapeIds = new Set<string>(multiSelectedShapeIds);

    if (selectedTextId) nextTextIds.add(selectedTextId);
    if (selectedImageId) nextImageIds.add(selectedImageId);
    if (selectedShapeId) nextShapeIds.add(selectedShapeId);

    if (!multi) {
      nextTextIds.clear();
      nextImageIds.clear();
      nextShapeIds.clear();
      if (type === "text") {
        nextSelectedTextId = id;
        nextSelectedImageId = null;
        nextSelectedShapeId = null;
        nextTextIds.add(id);
      } else if (type === "image") {
        nextSelectedImageId = id;
        nextSelectedTextId = null;
        nextSelectedShapeId = null;
        nextImageIds.add(id);
      } else {
        nextSelectedShapeId = id;
        nextSelectedTextId = null;
        nextSelectedImageId = null;
        nextShapeIds.add(id);
      }
    } else {
      const targetSet = type === "text" ? nextTextIds : type === "image" ? nextImageIds : nextShapeIds;
      const isSelected = targetSet.has(id);

      if (isSelected) {
        targetSet.delete(id);
      } else {
        targetSet.add(id);
      }

      nextSelectedTextId = type === "text" && !isSelected ? id : null;
      nextSelectedImageId = type === "image" && !isSelected ? id : null;
      nextSelectedShapeId = type === "shape" && !isSelected ? id : null;
    }

    setSelectedTextId(nextSelectedTextId);
    setSelectedImageId(nextSelectedImageId);
    setSelectedShapeId(nextSelectedShapeId);
    setMultiSelectedTextIds(Array.from(nextTextIds).filter((value) => value !== nextSelectedTextId));
    setMultiSelectedImageIds(Array.from(nextImageIds).filter((value) => value !== nextSelectedImageId));
    setMultiSelectedShapeIds(Array.from(nextShapeIds).filter((value) => value !== nextSelectedShapeId));
  };

  useEffect(() => {
    const textIdSet = new Set(activePage.textBoxes.map((box) => box.id));
    const imageIdSet = new Set(activePage.imageBoxes.map((box) => box.id));
    const shapeIdSet = new Set(activePage.shapeBoxes.map((box) => box.id));

    setMultiSelectedTextIds((prev) => prev.filter((id) => id !== selectedTextId && textIdSet.has(id)));
    setMultiSelectedImageIds((prev) => prev.filter((id) => id !== selectedImageId && imageIdSet.has(id)));
    setMultiSelectedShapeIds((prev) => prev.filter((id) => id !== selectedShapeId && shapeIdSet.has(id)));
  }, [activePage.imageBoxes, activePage.shapeBoxes, activePage.textBoxes, selectedImageId, selectedShapeId, selectedTextId]);

  const updateHistoryAvailability = useCallback(() => {
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, []);

  const resetHistoryTracking = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    historyReadyRef.current = false;
    previousSnapshotRef.current = null;
    previousSnapshotKeyRef.current = "";
    skipHistoryPushRef.current = false;
    updateHistoryAvailability();
  }, [updateHistoryAvailability]);

  const applyStoredDoc = useCallback((doc: StoredEditorDoc, options?: { skipHistoryPush?: boolean; resetHistory?: boolean }) => {
    const normalized = sanitizeStoredEditorDoc(doc, width, height, fallbackDoc);
    if (options?.skipHistoryPush) {
      skipHistoryPushRef.current = true;
    }
    if (options?.resetHistory) {
      resetHistoryTracking();
    }

    setPages(normalized.pages);
    setActivePageId(normalized.activePageId);
    setSelectedTextId(normalized.selectedTextId);
    setSelectedImageId(normalized.selectedImageId);
    setSelectedShapeId(normalized.selectedShapeId);
    setMultiSelectedTextIds([]);
    setMultiSelectedImageIds([]);
    setMultiSelectedShapeIds([]);
    setCustomFonts(normalized.customFonts);
    setUploadedFonts(normalized.uploadedFonts);
  }, [fallbackDoc, height, width, resetHistoryTracking]);

  useEffect(() => {
    if (!isHydrated) return;
    if (hasHydratedFromIndexedDbRef.current) return;

    hasHydratedFromIndexedDbRef.current = true;
    let cancelled = false;
    const storageKey = getDocStorageKey(projectScope, preset, width, height);

    const hydrateFromIndexedDb = async () => {
      const cachedDoc = await readEditorDocFromIndexedDb(storageKey);
      if (cancelled || !cachedDoc) return;
      applyStoredDoc(cachedDoc, { resetHistory: true });
    };

    void hydrateFromIndexedDb();
    return () => {
      cancelled = true;
    };
  }, [applyStoredDoc, height, isHydrated, preset, projectScope, width]);

  const undo = useCallback(() => {
    const previous = undoStackRef.current.pop();
    if (!previous) return;

    redoStackRef.current.push(cloneStoredDoc(currentDocRef.current));
    if (redoStackRef.current.length > HISTORY_LIMIT) {
      redoStackRef.current.shift();
    }

    updateHistoryAvailability();
    applyStoredDoc(previous, { skipHistoryPush: true });
  }, [applyStoredDoc, updateHistoryAvailability]);

  const redo = useCallback(() => {
    const next = redoStackRef.current.pop();
    if (!next) return;

    undoStackRef.current.push(cloneStoredDoc(currentDocRef.current));
    if (undoStackRef.current.length > HISTORY_LIMIT) {
      undoStackRef.current.shift();
    }

    updateHistoryAvailability();
    applyStoredDoc(next, { skipHistoryPush: true });
  }, [applyStoredDoc, updateHistoryAvailability]);

  const visiblePages = isHydrated ? pages : fallbackDoc.pages;
  const visibleActivePageId = isHydrated ? activePageId : fallbackDoc.activePageId;
  const visibleActivePage = useMemo<CanvasPage>(() => {
    return (
      visiblePages.find((page) => page.id === visibleActivePageId) || {
      id: "__fallback_visible",
      width,
      height,
      backgroundColor: "#ffffff",
      gradientEnabled: false,
      gradientDirection: "vertical",
      gradientColors: [...DEFAULT_GRADIENT_COLORS],
      borderWidth: 0,
      borderColor: "#0f172a",
      borderGradientEnabled: false,
      borderGradientDirection: "vertical",
      borderGradientColors: [...DEFAULT_BORDER_GRADIENT_COLORS],
      showGrid: true,
      imageBoxes: [],
      shapeBoxes: [],
      textBoxes: [],
    }
  );
  }, [height, visibleActivePageId, visiblePages, width]);
  const visibleSelectedTextBox = isHydrated ? selectedTextBox : null;
  const visibleSelectedImageBox = isHydrated ? selectedImageBox : null;
  const visibleSelectedShapeBox = isHydrated ? selectedShapeBox : null;
  const selectedFontFamily = selectedTextBox?.fontFamily || FONT_FAMILY_OPTIONS[0];
  const selectedFontKey = normalizeFontFamilyKey(selectedFontFamily);
  const isSelectedCustomFont = customFonts.some((font) => normalizeFontFamilyKey(font) === selectedFontKey);
  const isSelectedUploadedFont = uploadedFonts.some((font) => normalizeFontFamilyKey(font.family) === selectedFontKey);
  const canManageSelectedFont = Boolean(selectedTextBox) && (isSelectedCustomFont || isSelectedUploadedFont);
  const fontOptions = useMemo(() => {
    const fontsFromPages = pages.flatMap((page) => page.textBoxes.map((box) => box.fontFamily || ""));
    const uploadedFamilies = uploadedFonts.map((font) => font.family);
    return mergeFontOptions(FONT_FAMILY_OPTIONS, customFonts, uploadedFamilies, fontsFromPages);
  }, [customFonts, pages, uploadedFonts]);
  useEffect(() => {
    if (!selectedTextBox) {
      setFontManageValue("");
      return;
    }
    setFontManageValue(selectedFontFamily);
  }, [selectedFontFamily, selectedTextBox]);
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
    const layers = [...activePage.imageBoxes, ...activePage.shapeBoxes, ...activePage.textBoxes].map((item) =>
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
      gradientEnabled: source.gradientEnabled,
      gradientDirection: source.gradientDirection,
      gradientColors: [...source.gradientColors] as [string, string, string],
      borderWidth: source.borderWidth,
      borderColor: source.borderColor,
      borderGradientEnabled: source.borderGradientEnabled,
      borderGradientDirection: source.borderGradientDirection,
      borderGradientColors: [...source.borderGradientColors] as [string, string, string],
      showGrid: source.showGrid,
      imageBoxes: [],
      shapeBoxes: [],
      textBoxes: [],
    };

    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
    setSelectedTextId(null);
    setSelectedImageId(null);
    setSelectedShapeId(null);
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
      gradientEnabled: source.gradientEnabled,
      gradientDirection: source.gradientDirection,
      gradientColors: [...source.gradientColors] as [string, string, string],
      borderWidth: source.borderWidth,
      borderColor: source.borderColor,
      borderGradientEnabled: source.borderGradientEnabled,
      borderGradientDirection: source.borderGradientDirection,
      borderGradientColors: [...source.borderGradientColors] as [string, string, string],
      showGrid: source.showGrid,
      imageBoxes: source.imageBoxes.map((box) => ({ ...box, id: createImageId() })),
      shapeBoxes: source.shapeBoxes.map((box) => ({ ...box, id: createShapeId() })),
      textBoxes: source.textBoxes.map((box) => ({ ...box, id: createTextId() })),
    };

    const next = [...pages];
    next.splice(sourceIndex + 1, 0, copy);
    setPages(next);
    setActivePageId(copy.id);
    setSelectedTextId(null);
    setSelectedImageId(null);
    setSelectedShapeId(null);
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
      setSelectedShapeId(null);
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
      fontFamily: FONT_FAMILY_OPTIONS[0],
      fontSize: 56,
      lineHeight: DEFAULT_TEXT_LINE_HEIGHT,
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
    setSelectedShapeId(null);
  };

  const addShapeBox = (shapeType: CanvasShapeKind = "square") => {
    const { max } = getActivePageLayerBounds();
    const newShape: CanvasShapeBox = {
      id: createShapeId(),
      x: Math.max(20, Math.round(activePage.width * 0.3)),
      y: Math.max(20, Math.round(activePage.height * 0.3)),
      width: 180,
      height: 180,
      shapeType,
      fillEnabled: true,
      fillColor: "#38bdf8",
      gradientEnabled: false,
      gradientDirection: "vertical",
      gradientColors: [...DEFAULT_SHAPE_GRADIENT_COLORS],
      strokeColor: "#0f172a",
      strokeWidth: 2,
      rotation: 0,
      layer: max + 1,
    };

    setPages((prev) =>
      prev.map((page) =>
        page.id === activePage.id ? { ...page, shapeBoxes: [...page.shapeBoxes, newShape] } : page,
      ),
    );
    setSelectedShapeId(newShape.id);
    setSelectedTextId(null);
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
    setSelectedShapeId(null);
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
    if (Object.keys(updates).length === 0) return;

    setPages((prev) => {
      const pageIndex = prev.findIndex((page) => page.id === activePage.id);
      if (pageIndex < 0) return prev;

      const page = prev[pageIndex];
      const boxIndex = page.imageBoxes.findIndex((box) => box.id === imageId);
      if (boxIndex < 0) return prev;

      const nextBox = applyPartialUpdates(page.imageBoxes[boxIndex], updates);
      if (!nextBox) return prev;

      const nextImageBoxes = [...page.imageBoxes];
      nextImageBoxes[boxIndex] = nextBox;

      const nextPages = [...prev];
      nextPages[pageIndex] = { ...page, imageBoxes: nextImageBoxes };
      return nextPages;
    });
  };

  const updateSelectedImageBox = (updates: Partial<CanvasImageBox>) => {
    if (!selectedImageBox) return;
    updateImageBox(selectedImageBox.id, updates);
  };

  const updateShapeBox = (shapeId: string, updates: Partial<CanvasShapeBox>) => {
    if (Object.keys(updates).length === 0) return;

    setPages((prev) => {
      const pageIndex = prev.findIndex((page) => page.id === activePage.id);
      if (pageIndex < 0) return prev;

      const page = prev[pageIndex];
      const boxIndex = page.shapeBoxes.findIndex((box) => box.id === shapeId);
      if (boxIndex < 0) return prev;

      const nextBox = applyPartialUpdates(page.shapeBoxes[boxIndex], updates);
      if (!nextBox) return prev;

      const nextShapeBoxes = [...page.shapeBoxes];
      nextShapeBoxes[boxIndex] = nextBox;

      const nextPages = [...prev];
      nextPages[pageIndex] = { ...page, shapeBoxes: nextShapeBoxes };
      return nextPages;
    });
  };

  const updateSelectedShapeBox = (updates: Partial<CanvasShapeBox>) => {
    if (!selectedShapeBox) return;
    updateShapeBox(selectedShapeBox.id, updates);
  };

  const reorderActiveElement = (target: { type: "image" | "shape" | "text"; id: string }, position: "front" | "back") => {
    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== activePage.id) return page;

        const combined = [
          ...page.imageBoxes.map((box) => ({
            type: "image" as const,
            id: box.id,
            layer: Math.round(toSafeNumber(box.layer ?? 1, 1)),
          })),
          ...page.shapeBoxes.map((box) => ({
            type: "shape" as const,
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
          shapeBoxes: page.shapeBoxes.map((box) => ({
            ...box,
            layer: layerMap.get(`shape:${box.id}`) ?? 1,
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

  const reorderSelectedShapeBox = (position: "front" | "back") => {
    if (!selectedShapeBox) return;
    reorderActiveElement({ type: "shape", id: selectedShapeBox.id }, position);
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

  const deleteSelectedShapeBox = () => {
    if (!selectedShapeBox) return;

    setPages((prev) =>
      prev.map((page) =>
        page.id === activePage.id
          ? { ...page, shapeBoxes: page.shapeBoxes.filter((box) => box.id !== selectedShapeBox.id) }
          : page,
      ),
    );
    setSelectedShapeId(null);
  };

  const updateTextBox = (textId: string, updates: Partial<CanvasTextBox>) => {
    if (Object.keys(updates).length === 0) return;

    setPages((prev) => {
      const pageIndex = prev.findIndex((page) => page.id === activePage.id);
      if (pageIndex < 0) return prev;

      const page = prev[pageIndex];
      const boxIndex = page.textBoxes.findIndex((box) => box.id === textId);
      if (boxIndex < 0) return prev;

      const nextBox = applyPartialUpdates(page.textBoxes[boxIndex], updates);
      if (!nextBox) return prev;

      const nextTextBoxes = [...page.textBoxes];
      nextTextBoxes[boxIndex] = nextBox;

      const nextPages = [...prev];
      nextPages[pageIndex] = { ...page, textBoxes: nextTextBoxes };
      return nextPages;
    });
  };

  const updateSelectedTextBox = (updates: Partial<CanvasTextBox>) => {
    if (!selectedTextBox) return;
    updateTextBox(selectedTextBox.id, updates);
  };

  const applySelectedFontFamily = (family: string) => {
    updateSelectedTextBox({ fontFamily: family });
  };

  const replaceFontFamilyInDesign = (fromFamily: string, toFamily: string) => {
    const fromKey = normalizeFontFamilyKey(fromFamily);
    if (!fromKey) return;

    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        textBoxes: page.textBoxes.map((box) =>
          normalizeFontFamilyKey(box.fontFamily || FONT_FAMILY_OPTIONS[0]) === fromKey ? { ...box, fontFamily: toFamily } : box,
        ),
      })),
    );
  };

  const renameSelectedUserFont = () => {
    if (!selectedTextBox || !canManageSelectedFont) return;

    const currentFamily = selectedTextBox.fontFamily || FONT_FAMILY_OPTIONS[0];
    const currentKey = normalizeFontFamilyKey(currentFamily);
    const nextFamily = sanitizeFontName(fontManageValue);
    if (!nextFamily) return;

    const nextKey = normalizeFontFamilyKey(nextFamily);
    const hasConflict = fontOptions.some((font) => {
      const key = normalizeFontFamilyKey(font);
      return key === nextKey && key !== currentKey;
    });

    if (hasConflict) {
      setExportError("A font with that name already exists.");
      return;
    }

    setExportError(null);
    if (isSelectedUploadedFont) {
      clearDocumentFontFamily(currentFamily);
    }

    setCustomFonts((prev) =>
      mergeFontOptions(
        prev.map((font) => (normalizeFontFamilyKey(font) === currentKey ? nextFamily : font)),
      ),
    );
    setUploadedFonts((prev) =>
      prev.map((font) =>
        normalizeFontFamilyKey(font.family) === currentKey
          ? {
              ...font,
              family: nextFamily,
            }
          : font,
      ),
    );
    replaceFontFamilyInDesign(currentFamily, nextFamily);
    setFontManageValue(nextFamily);
  };

  const removeSelectedUserFont = () => {
    if (!selectedTextBox || !canManageSelectedFont) return;

    const targetFamily = selectedTextBox.fontFamily || FONT_FAMILY_OPTIONS[0];
    const targetKey = normalizeFontFamilyKey(targetFamily);
    const fallbackFamily = FONT_FAMILY_OPTIONS[0];

    if (isSelectedUploadedFont) {
      clearDocumentFontFamily(targetFamily);
    }

    setExportError(null);
    setCustomFonts((prev) => prev.filter((font) => normalizeFontFamilyKey(font) !== targetKey));
    setUploadedFonts((prev) => prev.filter((font) => normalizeFontFamilyKey(font.family) !== targetKey));
    replaceFontFamilyInDesign(targetFamily, fallbackFamily);
    setFontManageValue(fallbackFamily);
  };

  const addCustomFont = () => {
    const nextFont = sanitizeFontName(fontInputValue);
    if (!nextFont) return;

    setCustomFonts((prev) => mergeFontOptions(prev, [nextFont]));
    setFontInputValue("");
    if (selectedTextBox) {
      applySelectedFontFamily(nextFont);
    }
  };

  const handleFontUploadChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    const familyFromFile = sanitizeFontName(file.name.replace(/\.[^.]+$/, "")) || "Uploaded Font";
    const format = inferFontFormat(file);

    try {
      const source = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(new Error("Unable to read font file."));
        reader.readAsDataURL(file);
      });

      if (!source.startsWith("data:")) {
        throw new Error("Unsupported font file.");
      }

      const uploaded: UploadedFont = { family: familyFromFile, source, format };
      setUploadedFonts((prev) => upsertUploadedFont(prev, uploaded));

      if (typeof FontFace !== "undefined" && "fonts" in document) {
        clearDocumentFontFamily(familyFromFile);
        const formatHint = format ? ` format("${format}")` : "";
        const fontSet = (document as Document & { fonts: FontFaceSet }).fonts;
        const uploadedFace = new FontFace(familyFromFile, `url(${source})${formatHint}`, {
          style: "normal",
        });
        await uploadedFace.load();
        fontSet.add(uploadedFace);
        const escapedFamily = escapeCssString(familyFromFile);
        await fontSet.load(`16px "${escapedFamily}"`).catch(() => []);
      }

      if (selectedTextBox) {
        updateSelectedTextBox({ fontFamily: familyFromFile });
      }
    } catch {
      setExportError("Unable to upload font.");
    }
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
    if (Object.keys(updates).length === 0) return;

    setPages((prev) => {
      const pageIndex = prev.findIndex((page) => page.id === activePage.id);
      if (pageIndex < 0) return prev;

      const page = prev[pageIndex];
      const nextPage = applyPartialUpdates(page, updates);
      if (!nextPage) return prev;

      const nextPages = [...prev];
      nextPages[pageIndex] = nextPage;
      return nextPages;
    });
  };

  const handleDownloadImage = async (format: "png" | "jpg") => {
    if (!isHydrated) return;

    const pageNumber = Math.max(1, pages.findIndex((page) => page.id === activePage.id) + 1);

    try {
      setIsExporting(true);
      setExportError(null);
      const activeElement = document.activeElement as HTMLElement | null;
      const activeTag = activeElement?.tagName.toLowerCase();
      if (activeElement && (activeElement.isContentEditable || activeTag === "input" || activeTag === "textarea" || activeTag === "select")) {
        activeElement.blur();
      }
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => resolve());
        });
      });
      await exportDesignAsImage(activePage, format, `${filenameBase}-page-${pageNumber}`);
    } catch (error) {
      console.error("Image export failed:", error);
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
      const activeElement = document.activeElement as HTMLElement | null;
      const activeTag = activeElement?.tagName.toLowerCase();
      if (activeElement && (activeElement.isContentEditable || activeTag === "input" || activeTag === "textarea" || activeTag === "select")) {
        activeElement.blur();
      }
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => resolve());
        });
      });
      await exportDesignAsPdf(pages, filenameBase);
    } catch (error) {
      console.error("PDF export failed:", error);
      setExportError(error instanceof Error ? error.message : "Unable to export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName.toLowerCase();
        if (target.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select") {
          return;
        }
      }

      const key = event.key.toLowerCase();
      const selectedTextIds = new Set<string>(multiSelectedTextIds);
      const selectedImageIds = new Set<string>(multiSelectedImageIds);
      const selectedShapeIds = new Set<string>(multiSelectedShapeIds);
      if (selectedTextId) selectedTextIds.add(selectedTextId);
      if (selectedImageId) selectedImageIds.add(selectedImageId);
      if (selectedShapeId) selectedShapeIds.add(selectedShapeId);

      const hasCopyPasteModifier = event.ctrlKey || event.metaKey;
      if (hasCopyPasteModifier && !event.altKey) {
        if (key === "z") {
          event.preventDefault();
          if (event.shiftKey) {
            redo();
          } else {
            undo();
          }
          return;
        }
        if (key === "y") {
          event.preventDefault();
          redo();
          return;
        }
      }

      if (key === "delete" || key === "backspace") {
        const hasSelection = selectedTextIds.size > 0 || selectedImageIds.size > 0 || selectedShapeIds.size > 0;
        if (!hasSelection) return;

        event.preventDefault();
        setPages((prev) =>
          prev.map((page) =>
            page.id === activePage.id
              ? {
                  ...page,
                  textBoxes: page.textBoxes.filter((box) => !selectedTextIds.has(box.id)),
                  imageBoxes: page.imageBoxes.filter((box) => !selectedImageIds.has(box.id)),
                  shapeBoxes: page.shapeBoxes.filter((box) => !selectedShapeIds.has(box.id)),
                }
              : page,
          ),
        );
        setSelectedTextId(null);
        setSelectedImageId(null);
        setSelectedShapeId(null);
        setMultiSelectedTextIds([]);
        setMultiSelectedImageIds([]);
        setMultiSelectedShapeIds([]);
        return;
      }
      if (!hasCopyPasteModifier || event.altKey) return;

      if (key === "c") {
        let payload: CopiedElement | null = null;
        if (selectedTextBox) {
          payload = { type: "text", data: { ...selectedTextBox } };
        } else if (selectedImageBox) {
          payload = { type: "image", data: { ...selectedImageBox } };
        } else if (selectedShapeBox) {
          payload = {
            type: "shape",
            data: {
              ...selectedShapeBox,
              gradientColors: selectedShapeBox.gradientColors ? [...selectedShapeBox.gradientColors] as [string, string, string] : undefined,
            },
          };
        }

        if (!payload) return;
        event.preventDefault();
        setCopiedElement(payload);
        return;
      }

      if (key !== "v" || !copiedElement) return;
      event.preventDefault();

      if (copiedElement.type === "text") {
        const source = copiedElement.data;
        const pasted: CanvasTextBox = {
          ...source,
          id: createTextId(),
          x: clamp(source.x, 0, Math.max(0, activePage.width - source.width)),
          y: clamp(source.y, 0, Math.max(0, activePage.height - source.height)),
          layer: getPageMaxLayer(activePage) + 1,
        };

        setPages((prev) =>
          prev.map((page) =>
            page.id === activePage.id ? { ...page, textBoxes: [...page.textBoxes, pasted] } : page,
          ),
        );
        setSelectedTextId(pasted.id);
        setSelectedImageId(null);
        setSelectedShapeId(null);
        setCopiedElement({ type: "text", data: { ...pasted } });
        return;
      }

      if (copiedElement.type === "image") {
        const source = copiedElement.data;
        const pasted: CanvasImageBox = {
          ...source,
          id: createImageId(),
          x: clamp(source.x, 0, Math.max(0, activePage.width - source.width)),
          y: clamp(source.y, 0, Math.max(0, activePage.height - source.height)),
          layer: getPageMaxLayer(activePage) + 1,
        };

        setPages((prev) =>
          prev.map((page) =>
            page.id === activePage.id ? { ...page, imageBoxes: [...page.imageBoxes, pasted] } : page,
          ),
        );
        setSelectedImageId(pasted.id);
        setSelectedTextId(null);
        setSelectedShapeId(null);
        setCopiedElement({ type: "image", data: { ...pasted } });
        return;
      }

      const source = copiedElement.data;
      const pasted: CanvasShapeBox = {
        ...source,
        id: createShapeId(),
        x: clamp(source.x, 0, Math.max(0, activePage.width - source.width)),
        y: clamp(source.y, 0, Math.max(0, activePage.height - source.height)),
        layer: getPageMaxLayer(activePage) + 1,
        gradientColors: source.gradientColors ? [...source.gradientColors] as [string, string, string] : undefined,
      };

      setPages((prev) =>
        prev.map((page) =>
          page.id === activePage.id ? { ...page, shapeBoxes: [...page.shapeBoxes, pasted] } : page,
        ),
      );
      setSelectedShapeId(pasted.id);
      setSelectedTextId(null);
      setSelectedImageId(null);
      setCopiedElement({ type: "shape", data: { ...pasted, gradientColors: pasted.gradientColors ? [...pasted.gradientColors] as [string, string, string] : undefined } });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    activePage,
    currentDocRef,
    copiedElement,
    multiSelectedImageIds,
    multiSelectedShapeIds,
    multiSelectedTextIds,
    redo,
    selectedImageBox,
    selectedImageId,
    selectedShapeBox,
    selectedShapeId,
    selectedTextBox,
    selectedTextId,
    undo,
  ]);

  useEffect(() => {
    if (!readAuthSession()) {
      window.location.replace("/signin");
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const session = readAuthSession();

    if (!isHydrated || !session?.token) {
      return;
    }

    setIsCloudSyncReady(false);
    setCloudDesignId(null);

    const cloudDocName = getCloudDocName(projectScope, preset, width, height);
    const seedDoc = loadInitialEditorDoc(projectScope, preset, width, height, templateId);

    const loadCloudDoc = async () => {
      try {
        const listed = await listDesigns(session.token, { search: cloudDocName, limit: 100 });
        let cloudDesign = listed.designs.find((design) => design.name === cloudDocName) || null;

        if (!cloudDesign) {
          cloudDesign = await createDesign(session.token, {
            name: cloudDocName,
            description: "Auto-synced design editor document",
            canvas_data: seedDoc as Record<string, unknown>,
            width,
            height,
          });
        }

        if (isCancelled) return;

        setCloudDesignId(cloudDesign.id);
        setCloudSyncError(null);

        if (cloudDesign.canvas_data && typeof cloudDesign.canvas_data === "object") {
          const syncedDoc = sanitizeStoredEditorDoc(cloudDesign.canvas_data as Partial<StoredEditorDoc>, width, height, fallbackDoc);
          applyStoredDoc(syncedDoc, { resetHistory: true });
        }
      } catch (error) {
        if (isCancelled) return;
        setCloudSyncError(error instanceof Error ? `Cloud sync is unavailable: ${error.message}` : "Cloud sync is unavailable right now.");
      } finally {
        if (!isCancelled) {
          setIsCloudSyncReady(true);
        }
      }
    };

    loadCloudDoc();

    return () => {
      isCancelled = true;
    };
  }, [applyStoredDoc, fallbackDoc, height, isHydrated, preset, projectScope, templateId, width]);

  useEffect(() => {
    const session = readAuthSession();
    if (!isHydrated || !isCloudSyncReady || !cloudDesignId || !session?.token) {
      return;
    }

    const cloudDocName = getCloudDocName(projectScope, preset, width, height);
    const timer = window.setTimeout(async () => {
      try {
        await updateDesign(session.token, cloudDesignId, {
          name: cloudDocName,
          canvas_data: currentDoc as Record<string, unknown>,
          width,
          height,
        });
        setCloudSyncError(null);
      } catch (error) {
        setCloudSyncError(error instanceof Error ? `Cloud sync failed: ${error.message}` : "Cloud sync failed.");
      }
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [cloudDesignId, currentDoc, height, isCloudSyncReady, isHydrated, preset, projectScope, width]);

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
    window.localStorage.setItem(getProjectPreferenceKey(projectId), JSON.stringify(preference));

    if (projectId) {
      upsertProject({
        id: projectId,
        name: projectName || label,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      updateProjectConfig(projectId, {
        width,
        height,
        orientation,
        preset,
        templateId: templateId || undefined,
      });
    }
  }, [height, label, orientation, preset, projectId, projectName, templateId, width]);

  useEffect(() => {
    const styleId = "editor-uploaded-fonts-style";
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = LOCAL_FONT_FACES.map((font) => {
      const family = escapeCssString(font.family);
      const source = escapeCssString(font.source);
      const format = font.format ? ` format("${font.format}")` : "";
      return `@font-face{font-family:"${family}";src:url("${source}")${format};font-weight:${font.weight};font-style:normal;font-display:swap;}`;
    })
      .concat(
        uploadedFonts.map((font) => {
          const family = escapeCssString(font.family);
          const source = escapeCssString(font.source);
          const format = font.format ? ` format("${font.format}")` : "";
          return `@font-face{font-family:"${family}";src:url("${source}")${format};font-style:normal;font-display:swap;}`;
        }),
      )
      .join("\n");
  }, [uploadedFonts]);

  useEffect(() => {
    const snapshot = JSON.parse(serializedCurrentDoc) as StoredEditorDoc;
    const snapshotKey = serializedCurrentDoc;

    if (!historyReadyRef.current) {
      historyReadyRef.current = true;
      previousSnapshotRef.current = snapshot;
      previousSnapshotKeyRef.current = snapshotKey;
      updateHistoryAvailability();
      return;
    }

    if (snapshotKey === previousSnapshotKeyRef.current) {
      return;
    }

    if (skipHistoryPushRef.current) {
      skipHistoryPushRef.current = false;
      previousSnapshotRef.current = snapshot;
      previousSnapshotKeyRef.current = snapshotKey;
      updateHistoryAvailability();
      return;
    }

    if (previousSnapshotRef.current) {
      undoStackRef.current.push(cloneStoredDoc(previousSnapshotRef.current));
      if (undoStackRef.current.length > HISTORY_LIMIT) {
        undoStackRef.current.shift();
      }
      redoStackRef.current = [];
    }

    previousSnapshotRef.current = snapshot;
    previousSnapshotKeyRef.current = snapshotKey;
    updateHistoryAvailability();
  }, [serializedCurrentDoc, updateHistoryAvailability]);

  useEffect(() => {
    localAutosaveEnabledRef.current = true;
  }, [height, preset, width]);

  useEffect(() => {
    if (!isHydrated || !localAutosaveEnabledRef.current) return;

    const storageKey = getDocStorageKey(projectScope, preset, width, height);
    const payload = serializedCurrentDoc;

    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, payload);
        return;
      } catch (error) {
        if (!isStorageQuotaExceeded(error)) {
          console.warn("Local editor autosave failed.", error);
          return;
        }
      }

      try {
        pruneEditorDocCache(storageKey);
        window.localStorage.setItem(storageKey, payload);
        return;
      } catch (error) {
        if (!isStorageQuotaExceeded(error)) {
          console.warn("Local editor autosave failed after cache cleanup.", error);
        }
      }

      localAutosaveEnabledRef.current = false;
      console.warn("Local editor autosave disabled because browser storage quota is full.");
    }, LOCAL_STORAGE_AUTOSAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [height, isHydrated, preset, projectScope, serializedCurrentDoc, width]);

  useEffect(() => {
    if (!isHydrated) return;
    const storageKey = getDocStorageKey(projectScope, preset, width, height);
    const payload = serializedCurrentDoc;
    const timer = window.setTimeout(() => {
      void writeEditorDocToIndexedDb(storageKey, payload).catch((error) => {
        console.warn("IndexedDB design cache write failed.", error);
      });
    }, INDEXEDDB_AUTOSAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [height, isHydrated, preset, projectScope, serializedCurrentDoc, width]);

  return (
    <main className="min-h-screen bg-[linear-gradient(140deg,#f1f5f9_0%,#e2e8f0_35%,#f8fafc_100%)] p-2 pb-24 text-slate-900 sm:p-3 sm:pb-3">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 sm:gap-4">
        <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:items-center sm:px-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Editor</p>
            <h1 className="text-base font-bold sm:text-lg">
              {label} Canvas ({width} x {height}px)
            </h1>
            <p className="text-xs text-slate-500 capitalize">{orientation} orientation</p>
            <p className="text-xs text-slate-500">
              {visiblePages.length} page{visiblePages.length > 1 ? "s" : ""}
            </p>
            {exportError ? <p className="text-xs text-rose-600">{exportError}</p> : null}
          </div>
          <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="hidden min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex sm:text-sm"
              title="Undo (Ctrl/Cmd+Z)"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="hidden min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex sm:text-sm"
              title="Redo (Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y)"
            >
              Redo
            </button>
            <button
              type="button"
              onClick={addTextBox}
              className="hidden min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 sm:inline-flex sm:text-sm"
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
              className="hidden min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 sm:inline-flex sm:text-sm"
            >
              + Image
            </button>
            <button
              type="button"
              onClick={() => addShapeBox("square")}
              className="hidden min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 sm:inline-flex sm:text-sm"
            >
              + Shape
            </button>
            <button
              type="button"
              onClick={addPage}
              className="hidden min-h-10 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 sm:inline-flex sm:text-sm"
            >
              + Add Page
            </button>
            <Link
              href="/projects"
              className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium hover:bg-slate-100 sm:text-sm"
            >
              Back to Projects
            </Link>
            <div className="relative" ref={downloadMenuRef}>
              <button
                type="button"
                onClick={() => setIsDownloadMenuOpen((prev) => !prev)}
                disabled={isExporting || !isHydrated}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
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
          <section className="flex min-h-12 items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] shadow-sm sm:text-xs [&_button]:touch-manipulation [&_button]:min-h-8 [&_input]:touch-manipulation [&_select]:min-h-8">
            <p className="mr-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Text</p>
            <label className="shrink-0 flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
              Font
              <select
                value={visibleSelectedTextBox.fontFamily || FONT_FAMILY_OPTIONS[0]}
                onChange={(event) => applySelectedFontFamily(event.target.value)}
                className="max-w-28 rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
              >
                {fontOptions.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </label>
            <label className="shrink-0 flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
              Add Font
              <input
                type="text"
                value={fontInputValue}
                onChange={(event) => setFontInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCustomFont();
                  }
                }}
                placeholder="e.g. Poppins"
                className="w-28 rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
              />
              <button
                type="button"
                onClick={addCustomFont}
                className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
              >
                Add
              </button>
            </label>
            <input
              ref={fontUploadInputRef}
              type="file"
              accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
              className="hidden"
              onChange={handleFontUploadChange}
            />
            <button
              type="button"
              onClick={() => fontUploadInputRef.current?.click()}
              className="shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Upload Font
            </button>
            {canManageSelectedFont ? (
              <div className="shrink-0 flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
                <span>Manage</span>
                <input
                  type="text"
                  value={fontManageValue}
                  onChange={(event) => setFontManageValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      renameSelectedUserFont();
                    }
                  }}
                  className="w-28 rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
                />
                <button
                  type="button"
                  onClick={renameSelectedUserFont}
                  className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={removeSelectedUserFont}
                  className="rounded border border-rose-300 bg-rose-50 px-1.5 py-0.5 text-[11px] font-medium text-rose-700 hover:bg-rose-100"
                >
                  Remove
                </button>
              </div>
            ) : null}
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
            <label className="shrink-0 flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
              Line
              <input
                type="number"
                min={0.8}
                max={3}
                step={0.05}
                value={visibleSelectedTextBox.lineHeight ?? DEFAULT_TEXT_LINE_HEIGHT}
                onChange={(event) => {
                  const value = Number.parseFloat(event.target.value);
                  if (!Number.isFinite(value)) return;
                  updateSelectedTextBox({ lineHeight: Math.max(0.8, Math.min(3, value)) });
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
          <section className="flex min-h-12 items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] shadow-sm sm:text-xs [&_button]:touch-manipulation [&_button]:min-h-8 [&_input]:touch-manipulation [&_select]:min-h-8">
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
        ) : visibleSelectedShapeBox ? (
          <section className="flex min-h-12 items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] shadow-sm sm:text-xs [&_button]:touch-manipulation [&_button]:min-h-8 [&_input]:touch-manipulation [&_select]:min-h-8">
            <p className="mr-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Shape</p>
            <label className="shrink-0 flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
              Type
              <select
                value={visibleSelectedShapeBox.shapeType}
                onChange={(event) =>
                  updateSelectedShapeBox({
                    shapeType: SHAPE_KIND_OPTIONS.includes(event.target.value as CanvasShapeKind)
                      ? (event.target.value as CanvasShapeKind)
                      : "square",
                  })
                }
                className="rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
              >
                {SHAPE_KIND_OPTIONS.map((shapeType) => (
                  <option key={shapeType} value={shapeType}>
                    {shapeType[0].toUpperCase()}
                    {shapeType.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() =>
                updateSelectedShapeBox({
                  fillEnabled: visibleSelectedShapeBox.fillEnabled === false,
                })
              }
              className={`shrink-0 rounded-md border px-2 py-1 text-xs font-medium ${
                visibleSelectedShapeBox.fillEnabled === false
                  ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  : "border-sky-400 bg-sky-50 text-sky-700"
              }`}
            >
              Fill {visibleSelectedShapeBox.fillEnabled === false ? "Off" : "On"}
            </button>
            <label className="shrink-0 flex items-center gap-1 text-xs text-slate-600">
              Fill
              <input
                type="color"
                value={visibleSelectedShapeBox.fillColor || "#38bdf8"}
                onChange={(event) => updateSelectedShapeBox({ fillColor: event.target.value })}
                disabled={visibleSelectedShapeBox.fillEnabled === false}
                className="h-7 w-8 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
              />
            </label>
            <button
              type="button"
              onClick={() => updateSelectedShapeBox({ gradientEnabled: !visibleSelectedShapeBox.gradientEnabled })}
              disabled={visibleSelectedShapeBox.fillEnabled === false}
              className={`shrink-0 rounded-md border px-2 py-1 text-xs font-medium ${
                visibleSelectedShapeBox.gradientEnabled
                  ? "border-sky-400 bg-sky-50 text-sky-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              } ${visibleSelectedShapeBox.fillEnabled === false ? "cursor-not-allowed opacity-50" : ""}`}
            >
              Gradient {visibleSelectedShapeBox.gradientEnabled ? "On" : "Off"}
            </button>
            <div className="shrink-0 inline-flex items-center overflow-hidden rounded-md border border-slate-300">
              <button
                type="button"
                onClick={() => updateSelectedShapeBox({ gradientDirection: "vertical" })}
                disabled={visibleSelectedShapeBox.fillEnabled === false}
                className={`px-2 py-1 text-xs ${
                  (visibleSelectedShapeBox.gradientDirection || "vertical") === "vertical"
                    ? "bg-sky-50 text-sky-700"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                } ${visibleSelectedShapeBox.fillEnabled === false ? "cursor-not-allowed opacity-50" : ""}`}
              >
                Vertical
              </button>
              <button
                type="button"
                onClick={() => updateSelectedShapeBox({ gradientDirection: "horizontal" })}
                disabled={visibleSelectedShapeBox.fillEnabled === false}
                className={`px-2 py-1 text-xs ${
                  (visibleSelectedShapeBox.gradientDirection || "vertical") === "horizontal"
                    ? "bg-sky-50 text-sky-700"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                } ${visibleSelectedShapeBox.fillEnabled === false ? "cursor-not-allowed opacity-50" : ""}`}
              >
                Horizontal
              </button>
            </div>
            {[0, 1, 2].map((index) => (
              <label key={`sg-${index}`} className="shrink-0 flex items-center gap-1 text-xs text-slate-600">
                SG{index + 1}
                <input
                  type="color"
                  value={visibleSelectedShapeBox.gradientColors?.[index] || DEFAULT_SHAPE_GRADIENT_COLORS[index]}
                  onChange={(event) => {
                    const next = [
                      visibleSelectedShapeBox.gradientColors?.[0] || DEFAULT_SHAPE_GRADIENT_COLORS[0],
                      visibleSelectedShapeBox.gradientColors?.[1] || DEFAULT_SHAPE_GRADIENT_COLORS[1],
                      visibleSelectedShapeBox.gradientColors?.[2] || DEFAULT_SHAPE_GRADIENT_COLORS[2],
                    ] as [string, string, string];
                    next[index] = event.target.value;
                    updateSelectedShapeBox({ gradientColors: next });
                  }}
                  disabled={visibleSelectedShapeBox.fillEnabled === false}
                  className="h-7 w-8 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
                />
              </label>
            ))}
            <label className="shrink-0 flex items-center gap-1 text-xs text-slate-600">
              Stroke
              <input
                type="color"
                value={visibleSelectedShapeBox.strokeColor || "#0f172a"}
                onChange={(event) => updateSelectedShapeBox({ strokeColor: event.target.value })}
                className="h-7 w-8 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
              />
            </label>
            <label className="shrink-0 flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
              Stroke W
              <input
                type="number"
                min={0}
                max={80}
                step={1}
                value={Math.round(visibleSelectedShapeBox.strokeWidth ?? 2)}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  if (!Number.isFinite(value)) return;
                  updateSelectedShapeBox({ strokeWidth: Math.max(0, Math.min(80, value)) });
                }}
                className="w-14 rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
              />
            </label>
            <label className="shrink-0 flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
              Rotate
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={visibleSelectedShapeBox.rotation ?? 0}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  if (!Number.isFinite(value)) return;
                  updateSelectedShapeBox({ rotation: Math.max(-180, Math.min(180, value)) });
                }}
                className="w-20 accent-sky-600"
              />
              <input
                type="number"
                min={-180}
                max={180}
                step={1}
                value={visibleSelectedShapeBox.rotation ?? 0}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  if (!Number.isFinite(value)) return;
                  updateSelectedShapeBox({ rotation: Math.max(-180, Math.min(180, value)) });
                }}
                className="w-14 rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
              />
            </label>
            <button
              type="button"
              onClick={() => reorderSelectedShapeBox("front")}
              className="shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Bring Front
            </button>
            <button
              type="button"
              onClick={() => reorderSelectedShapeBox("back")}
              className="shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Send Back
            </button>
            <button
              type="button"
              onClick={deleteSelectedShapeBox}
              className="ml-1 shrink-0 rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
            >
              Delete
            </button>
          </section>
        ) : (
          <section className="flex min-h-12 items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] shadow-sm sm:text-xs [&_button]:touch-manipulation [&_button]:min-h-8 [&_input]:touch-manipulation [&_select]:min-h-8">
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
              onClick={() => updateActivePage({ gradientEnabled: !visibleActivePage.gradientEnabled })}
              className={`shrink-0 rounded-md border px-2 py-1 text-xs font-medium ${
                visibleActivePage.gradientEnabled
                  ? "border-sky-400 bg-sky-50 text-sky-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Gradient {visibleActivePage.gradientEnabled ? "On" : "Off"}
            </button>
            <div className="shrink-0 inline-flex items-center overflow-hidden rounded-md border border-slate-300">
              <button
                type="button"
                onClick={() => updateActivePage({ gradientDirection: "vertical" })}
                className={`px-2 py-1 text-xs ${
                  visibleActivePage.gradientDirection === "vertical"
                    ? "bg-sky-50 text-sky-700"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Vertical
              </button>
              <button
                type="button"
                onClick={() => updateActivePage({ gradientDirection: "horizontal" })}
                className={`px-2 py-1 text-xs ${
                  visibleActivePage.gradientDirection === "horizontal"
                    ? "bg-sky-50 text-sky-700"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Horizontal
              </button>
            </div>
            {[0, 1, 2].map((index) => (
              <label key={index} className="shrink-0 flex items-center gap-1 text-xs text-slate-600">
                G{index + 1}
                <input
                  type="color"
                  value={visibleActivePage.gradientColors[index] || DEFAULT_GRADIENT_COLORS[index]}
                  onChange={(event) => {
                    const next = [...visibleActivePage.gradientColors] as [string, string, string];
                    next[index] = event.target.value;
                    updateActivePage({ gradientColors: next });
                  }}
                  className="h-7 w-8 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
                />
              </label>
            ))}
            <label className="shrink-0 flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
              Border
              <input
                type="range"
                min={0}
                max={200}
                step={1}
                value={Math.round(visibleActivePage.borderWidth ?? 0)}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  if (!Number.isFinite(value)) return;
                  updateActivePage({ borderWidth: Math.max(0, Math.min(200, value)) });
                }}
                className="w-20 accent-sky-600"
              />
              <input
                type="number"
                min={0}
                max={200}
                step={1}
                value={Math.round(visibleActivePage.borderWidth ?? 0)}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  if (!Number.isFinite(value)) return;
                  updateActivePage({ borderWidth: Math.max(0, Math.min(200, value)) });
                }}
                className="w-14 rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
              />
            </label>
            <label className="shrink-0 flex items-center gap-1 text-xs text-slate-600">
              Border Color
              <input
                type="color"
                value={visibleActivePage.borderColor || "#0f172a"}
                onChange={(event) => updateActivePage({ borderColor: event.target.value })}
                className="h-7 w-8 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
              />
            </label>
            <button
              type="button"
              onClick={() => updateActivePage({ borderGradientEnabled: !visibleActivePage.borderGradientEnabled })}
              className={`shrink-0 rounded-md border px-2 py-1 text-xs font-medium ${
                visibleActivePage.borderGradientEnabled
                  ? "border-sky-400 bg-sky-50 text-sky-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Border Gradient {visibleActivePage.borderGradientEnabled ? "On" : "Off"}
            </button>
            <div className="shrink-0 inline-flex items-center overflow-hidden rounded-md border border-slate-300">
              <button
                type="button"
                onClick={() => updateActivePage({ borderGradientDirection: "vertical" })}
                className={`px-2 py-1 text-xs ${
                  visibleActivePage.borderGradientDirection === "vertical"
                    ? "bg-sky-50 text-sky-700"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                B-Vertical
              </button>
              <button
                type="button"
                onClick={() => updateActivePage({ borderGradientDirection: "horizontal" })}
                className={`px-2 py-1 text-xs ${
                  visibleActivePage.borderGradientDirection === "horizontal"
                    ? "bg-sky-50 text-sky-700"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                B-Horizontal
              </button>
            </div>
            {[0, 1, 2].map((index) => (
              <label key={`b-${index}`} className="shrink-0 flex items-center gap-1 text-xs text-slate-600">
                B{index + 1}
                <input
                  type="color"
                  value={visibleActivePage.borderGradientColors[index] || DEFAULT_BORDER_GRADIENT_COLORS[index]}
                  onChange={(event) => {
                    const next = [...visibleActivePage.borderGradientColors] as [string, string, string];
                    next[index] = event.target.value;
                    updateActivePage({ borderGradientColors: next });
                  }}
                  className="h-7 w-8 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
                />
              </label>
            ))}
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

        <section className="min-h-[60dvh] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-2 sm:p-4">
          <div className="flex h-[68dvh] min-h-[420px] flex-col gap-3 lg:h-[calc(100dvh-190px)] lg:flex-row lg:gap-4">
            <div
              ref={canvasViewportRef}
              className={`flex-1 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2 sm:p-5 ${
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
                    backgroundGradientEnabled={visibleActivePage.gradientEnabled}
                    backgroundGradientDirection={visibleActivePage.gradientDirection}
                    backgroundGradientColors={visibleActivePage.gradientColors}
                    borderWidth={visibleActivePage.borderWidth}
                    borderColor={visibleActivePage.borderColor}
                    borderGradientEnabled={visibleActivePage.borderGradientEnabled}
                    borderGradientDirection={visibleActivePage.borderGradientDirection}
                    borderGradientColors={visibleActivePage.borderGradientColors}
                    showGrid={visibleActivePage.showGrid}
                    imageBoxes={visibleActivePage.imageBoxes}
                    selectedImageId={isHydrated ? selectedImageId : null}
                    selectedImageIds={isHydrated ? selectedImageIdsForCanvas : []}
                    onSelectImage={(id, options) => {
                      applySelection("image", id, options);
                    }}
                    onUpdateImageBox={updateImageBox}
                    shapeBoxes={visibleActivePage.shapeBoxes}
                    selectedShapeId={isHydrated ? selectedShapeId : null}
                    selectedShapeIds={isHydrated ? selectedShapeIdsForCanvas : []}
                    onSelectShape={(id, options) => {
                      applySelection("shape", id, options);
                    }}
                    onUpdateShapeBox={updateShapeBox}
                    textBoxes={visibleActivePage.textBoxes}
                    selectedTextId={isHydrated ? selectedTextId : null}
                    selectedTextIds={isHydrated ? selectedTextIdsForCanvas : []}
                    onSelectText={(id, options) => {
                      applySelection("text", id, options);
                    }}
                    onUpdateTextBox={updateTextBox}
                  />
                </div>
              </div>
            </div>

            <aside className="w-full shrink-0 overflow-x-auto overflow-y-hidden rounded-xl border border-slate-200 bg-white p-2 lg:w-28 lg:overflow-x-hidden lg:overflow-y-auto">
              <div className="flex min-w-max flex-row items-start gap-3 lg:min-w-0 lg:flex-col lg:items-center">
                {visiblePages.map((page, index) => {
                  const thumbScale = Math.min(THUMBNAIL_MAX_WIDTH / page.width, THUMBNAIL_MAX_HEIGHT / page.height);
                  const thumbWidth = Math.max(18, Math.round(page.width * thumbScale));
                  const thumbHeight = Math.max(18, Math.round(page.height * thumbScale));
                  const isActive = page.id === visibleActivePageId;

                  return (
                    <div key={page.id} className="w-24 shrink-0 lg:w-full">
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
                          setSelectedShapeId(null);
                        }}
                        aria-label={`Open page ${index + 1}`}
                        title={`Page ${index + 1}`}
                        className={`group flex w-full justify-center rounded-lg border p-2 transition ${
                          isActive ? "border-sky-500 bg-sky-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        } ${dragOverPageId === page.id ? "ring-2 ring-sky-300" : ""}`}
                      >
                        <span
                          className="relative block overflow-hidden border border-slate-300 shadow-sm"
                          style={{
                            width: thumbWidth,
                            height: thumbHeight,
                            backgroundColor: page.backgroundColor || "#ffffff",
                            backgroundImage: getPageGradientCss(page),
                          }}
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
                          <span className="pointer-events-none absolute inset-0 border border-slate-200" />
                          {toSafeNumber(page.borderWidth, 0) > 0 && (
                            <span
                              className="pointer-events-none absolute inset-0"
                              style={{
                                borderStyle: "solid",
                                borderWidth: Math.max(0, toSafeNumber(page.borderWidth, 0) * thumbScale),
                                borderColor: page.borderGradientEnabled ? "transparent" : page.borderColor || "#0f172a",
                                borderImageSource: getBorderGradientCss(page),
                                borderImageSlice: page.borderGradientEnabled ? 1 : undefined,
                                boxSizing: "border-box",
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
                              <span
                                key={image.id}
                                className="pointer-events-none absolute block overflow-hidden rounded"
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
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={image.src} alt="" className="h-full w-full object-cover" />
                              </span>
                            );
                          })}
                          {page.shapeBoxes.map((shape) => {
                            const previewX = Math.max(0, toSafeNumber(shape.x, 0) * thumbScale);
                            const previewY = Math.max(0, toSafeNumber(shape.y, 0) * thumbScale);
                            const previewWidth = Math.max(2, toSafeNumber(shape.width, 180) * thumbScale);
                            const previewHeight = Math.max(2, toSafeNumber(shape.height, 180) * thumbScale);
                            const baseWidth = Math.max(1, toSafeNumber(shape.width, 180));
                            const baseHeight = Math.max(1, toSafeNumber(shape.height, 180));
                            const previewRotation = clamp(toSafeNumber(shape.rotation ?? 0, 0), -180, 180);
                            const shapeType: CanvasShapeKind =
                              shape.shapeType === "circle" || shape.shapeType === "triangle" ? shape.shapeType : "square";
                            const shapeFillEnabled = shape.fillEnabled !== false;
                            const fillColor = sanitizeHexColor(shape.fillColor, "#38bdf8");
                            const shapeGradientEnabled = shapeFillEnabled && Boolean(shape.gradientEnabled);
                            const shapeGradientDirection = shape.gradientDirection === "horizontal" ? "horizontal" : "vertical";
                            const [shapeGradientStart, shapeGradientMiddle, shapeGradientEnd] =
                              shape.gradientColors || DEFAULT_SHAPE_GRADIENT_COLORS;
                            const gradientId = `thumb-shape-grad-${shape.id}`;
                            const fillValue = shapeFillEnabled ? (shapeGradientEnabled ? `url(#${gradientId})` : fillColor) : "none";
                            const strokeColor = sanitizeHexColor(shape.strokeColor, "#0f172a");
                            const strokeWidth = Math.max(0, toSafeNumber(shape.strokeWidth ?? 2, 2));
                            // Use original shape dimensions so thumbnail stroke scales down with thumbnail size.
                            const normalizedStrokeWidth = Math.max(0, (strokeWidth * 100) / Math.max(baseWidth, baseHeight));

                            return (
                              <span
                                key={shape.id}
                                className="absolute block"
                                style={{
                                  left: previewX,
                                  top: previewY,
                                  width: previewWidth,
                                  height: previewHeight,
                                  transform: `rotate(${previewRotation}deg)`,
                                  transformOrigin: "center center",
                                  zIndex: Math.round(toSafeNumber(shape.layer ?? 0, 0)),
                                }}
                              >
                                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
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
                                      fill={fillValue}
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
                                      fill={fillValue}
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
                                      fill={fillValue}
                                      stroke={strokeColor}
                                      strokeWidth={normalizedStrokeWidth}
                                      vectorEffect="non-scaling-stroke"
                                    />
                                  )}
                                </svg>
                              </span>
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
                                className="absolute block h-full whitespace-pre-wrap break-words"
                                style={{
                                  left: previewX,
                                  top: previewY,
                                  width: previewWidth,
                                  height: previewHeight,
                                  fontFamily: toFontFamilyCss(box.fontFamily || FONT_FAMILY_OPTIONS[0]),
                                  fontSize: previewFontSize,
                                  fontWeight: box.fontWeight || "700",
                                  textAlign: box.textAlign || "left",
                                  color: box.color || "#0f172a",
                                  transform: `rotate(${previewRotation}deg)`,
                                  transformOrigin: "center center",
                                  lineHeight: clamp(
                                    toSafeNumber(box.lineHeight ?? DEFAULT_TEXT_LINE_HEIGHT, DEFAULT_TEXT_LINE_HEIGHT),
                                    0.8,
                                    3,
                                  ),
                                  zIndex: Math.round(toSafeNumber(box.layer ?? 0, 0)),
                                }}
                              >
                                {box.text || "Double-click to edit"}
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
                          className="rounded border border-slate-200 px-2 py-1 text-[10px] text-slate-600 hover:bg-slate-100"
                          title="Duplicate page"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePage(page.id)}
                          disabled={visiblePages.length <= 1}
                          aria-label={`Delete page ${index + 1}`}
                          className="rounded border border-slate-200 px-2 py-1 text-[10px] text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
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
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-8px_20px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
        <div className="mx-auto grid w-full max-w-md grid-cols-5 gap-2">
          <button
            type="button"
            onClick={addTextBox}
            className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-700 active:bg-slate-100"
          >
            Text
          </button>
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-700 active:bg-slate-100"
          >
            Image
          </button>
          <button
            type="button"
            onClick={() => addShapeBox("square")}
            className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-700 active:bg-slate-100"
          >
            Shape
          </button>
          <button
            type="button"
            onClick={addPage}
            className="min-h-10 rounded-lg bg-slate-900 px-2 text-[11px] font-semibold text-white active:bg-slate-700"
          >
            Page
          </button>
          <button
            type="button"
            onClick={async () => {
              await handleDownloadImage("png");
            }}
            disabled={isExporting || !isHydrated}
            className="min-h-10 rounded-lg border border-slate-300 bg-slate-50 px-2 text-[11px] font-semibold text-slate-700 active:bg-slate-100 disabled:opacity-50"
          >
            Export
          </button>
        </div>
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
