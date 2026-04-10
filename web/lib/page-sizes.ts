export type PagePreset = {
  id: string;
  label: string;
  width: number;
  height: number;
  description: string;
};

export type Orientation = "portrait" | "landscape";

export type SavedPagePreference = {
  selectedId: string;
  customWidth: string;
  customHeight: string;
  orientation: Orientation;
  label: string;
  width: number;
  height: number;
};

export const PAGE_PRESETS: PagePreset[] = [
  {
    id: "a4",
    label: "A4",
    width: 794,
    height: 1123,
    description: "Standard print document",
  },
  {
    id: "a3",
    label: "A3",
    width: 1123,
    height: 1587,
    description: "Large poster and print layout",
  },
  {
    id: "q4",
    label: "Q4",
    width: 794,
    height: 1123,
    description: "Alias preset (same size as A4)",
  },
  {
    id: "letter",
    label: "Letter",
    width: 816,
    height: 1056,
    description: "US letter paper",
  },
  {
    id: "instagram",
    label: "Instagram Post",
    width: 1080,
    height: 1080,
    description: "Square social media post",
  },
  {
    id: "story",
    label: "Story",
    width: 1080,
    height: 1920,
    description: "Vertical social story",
  },
];

export const DEFAULT_PAGE = PAGE_PRESETS[0];
export const PAGE_PREF_KEY = "design-editor-page-pref-v1";

export function parseDimension(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;

  return Math.max(100, Math.min(5000, parsed));
}

export function applyOrientation(width: number, height: number, orientation: Orientation) {
  if (orientation === "landscape" && height > width) {
    return { width: height, height: width };
  }

  if (orientation === "portrait" && width > height) {
    return { width: height, height: width };
  }

  return { width, height };
}
