export type EditorTemplate = {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  orientation: "portrait" | "landscape";
  backgroundColor: string;
  gradientEnabled: boolean;
  gradientDirection: "vertical" | "horizontal";
  gradientColors: [string, string, string];
  borderWidth: number;
  borderColor: string;
  borderGradientEnabled: boolean;
  borderGradientDirection: "vertical" | "horizontal";
  borderGradientColors: [string, string, string];
};

export const EDITOR_TEMPLATES: EditorTemplate[] = [
  {
    id: "clean-poster",
    name: "Clean Poster",
    description: "Minimal poster with a soft gradient background.",
    width: 1080,
    height: 1350,
    orientation: "portrait",
    backgroundColor: "#f8fafc",
    gradientEnabled: true,
    gradientDirection: "vertical",
    gradientColors: ["#f8fafc", "#e2e8f0", "#cbd5e1"],
    borderWidth: 0,
    borderColor: "#0f172a",
    borderGradientEnabled: false,
    borderGradientDirection: "vertical",
    borderGradientColors: ["#0f172a", "#475569", "#0f172a"],
  },
  {
    id: "social-story",
    name: "Social Story",
    description: "Tall social story style with vibrant diagonal feel.",
    width: 1080,
    height: 1920,
    orientation: "portrait",
    backgroundColor: "#0f172a",
    gradientEnabled: true,
    gradientDirection: "horizontal",
    gradientColors: ["#0f172a", "#0ea5e9", "#22d3ee"],
    borderWidth: 0,
    borderColor: "#0f172a",
    borderGradientEnabled: false,
    borderGradientDirection: "vertical",
    borderGradientColors: ["#0f172a", "#475569", "#0f172a"],
  },
  {
    id: "frame-flyer",
    name: "Frame Flyer",
    description: "Balanced flyer with a subtle border frame.",
    width: 1200,
    height: 1600,
    orientation: "portrait",
    backgroundColor: "#ffffff",
    gradientEnabled: false,
    gradientDirection: "vertical",
    gradientColors: ["#ffffff", "#ffffff", "#ffffff"],
    borderWidth: 18,
    borderColor: "#0f172a",
    borderGradientEnabled: true,
    borderGradientDirection: "vertical",
    borderGradientColors: ["#0f172a", "#475569", "#0f172a"],
  },
];

export function getEditorTemplate(templateId: string | null) {
  if (!templateId) return null;
  return EDITOR_TEMPLATES.find((template) => template.id === templateId) || null;
}
