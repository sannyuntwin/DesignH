"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearAuthSession, readAuthSession } from "@/lib/auth-session";
import { EDITOR_TEMPLATES, getEditorTemplate } from "@/lib/editor-templates";
import { updateProjectConfig, upsertProject } from "@/lib/projects";
import {
  applyOrientation,
  DEFAULT_PAGE,
  Orientation,
  PAGE_PREF_KEY,
  PAGE_PRESETS,
  SavedPagePreference,
} from "@/lib/page-sizes";

const CUSTOM_PRESET_ID = "custom";
const FORCE_PICK_QUERY = "pick";
const PROJECT_ID_QUERY = "projectId";
const PROJECT_NAME_QUERY = "projectName";

function getProjectPreferenceKey(projectId: string) {
  return `${PAGE_PREF_KEY}:${projectId}`;
}

function SetupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forcePick = searchParams.get(FORCE_PICK_QUERY) === "1";
  const projectId = searchParams.get(PROJECT_ID_QUERY)?.trim() || "";
  const projectName = searchParams.get(PROJECT_NAME_QUERY)?.trim() || "";

  const [setupMode, setSetupMode] = useState<"size" | "template">("size");
  const [selectedId, setSelectedId] = useState(DEFAULT_PAGE.id);
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [customWidth, setCustomWidth] = useState("1200");
  const [customHeight, setCustomHeight] = useState("1600");
  const [selectedTemplateId, setSelectedTemplateId] = useState(EDITOR_TEMPLATES[0]?.id || "");

  const selectedPreset = PAGE_PRESETS.find((preset) => preset.id === selectedId);
  const selectedTemplate = getEditorTemplate(selectedTemplateId);

  useEffect(() => {
    if (!readAuthSession()) {
      router.replace("/signin");
      return;
    }

    if (!projectId || !projectName) {
      router.replace("/projects");
      return;
    }

    upsertProject({
      id: projectId,
      name: projectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }, [projectId, projectName, router]);

  useEffect(() => {
    if (!readAuthSession()) return;
    if (!projectId || !projectName) return;
    try {
      const raw = window.localStorage.getItem(getProjectPreferenceKey(projectId));
      if (!raw) return;

      const saved = JSON.parse(raw) as SavedPagePreference;
      if (!forcePick && saved.width >= 100 && saved.height >= 100) {
        const query = new URLSearchParams({
          label: projectName,
          w: String(saved.width),
          h: String(saved.height),
          o: saved.orientation || "portrait",
          preset: saved.selectedId || DEFAULT_PAGE.id,
          projectId,
          projectName,
        });
        router.replace(`/editor?${query.toString()}`);
        return;
      }
    } catch {
      // Ignore malformed localStorage values and continue with defaults.
    }
  }, [forcePick, projectId, projectName, router]);

  const selectedSize = useMemo(() => {
    if (selectedId === CUSTOM_PRESET_ID) {
      const rawWidth = Number.parseInt(customWidth, 10);
      const rawHeight = Number.parseInt(customHeight, 10);
      const isValid = Number.isFinite(rawWidth) && Number.isFinite(rawHeight) && rawWidth >= 100 && rawHeight >= 100;
      const oriented = applyOrientation(rawWidth, rawHeight, orientation);

      return {
        label: "Custom",
        width: oriented.width,
        height: oriented.height,
        isValid,
      };
    }

    if (!selectedPreset) {
      const oriented = applyOrientation(DEFAULT_PAGE.width, DEFAULT_PAGE.height, orientation);
      return {
        label: DEFAULT_PAGE.label,
        width: oriented.width,
        height: oriented.height,
        isValid: true,
      };
    }

    const oriented = applyOrientation(selectedPreset.width, selectedPreset.height, orientation);
    return {
      label: selectedPreset.label,
      width: oriented.width,
      height: oriented.height,
      isValid: true,
    };
  }, [customHeight, customWidth, orientation, selectedId, selectedPreset]);

  const selectedCanvasConfig = useMemo(() => {
    if (setupMode === "template" && selectedTemplate) {
      return {
        label: selectedTemplate.name,
        width: selectedTemplate.width,
        height: selectedTemplate.height,
        orientation: selectedTemplate.orientation,
        isValid: true,
      };
    }

    return {
      label: selectedSize.label,
      width: selectedSize.width,
      height: selectedSize.height,
      orientation,
      isValid: selectedSize.isValid,
    };
  }, [orientation, selectedSize, selectedTemplate, setupMode]);

  const goToEditor = () => {
    if (!readAuthSession()) return;
    if (!projectId || !projectName) return;
    if (!selectedCanvasConfig.isValid) return;
    if (setupMode === "template" && !selectedTemplate) return;

    const preference: SavedPagePreference = {
      selectedId: setupMode === "template" ? `template:${selectedTemplate?.id || "custom"}` : selectedId,
      customWidth,
      customHeight,
      orientation: selectedCanvasConfig.orientation,
      label: projectName,
      width: selectedCanvasConfig.width,
      height: selectedCanvasConfig.height,
    };
    window.localStorage.setItem(getProjectPreferenceKey(projectId), JSON.stringify(preference));

    updateProjectConfig(projectId, {
      width: selectedCanvasConfig.width,
      height: selectedCanvasConfig.height,
      orientation: selectedCanvasConfig.orientation,
      preset: setupMode === "template" ? `template:${selectedTemplate?.id || "custom"}` : selectedId,
      templateId: setupMode === "template" ? selectedTemplate?.id : undefined,
    });

    const query = new URLSearchParams({
      label: projectName,
      w: String(selectedCanvasConfig.width),
      h: String(selectedCanvasConfig.height),
      o: selectedCanvasConfig.orientation,
      preset: setupMode === "template" ? `template:${selectedTemplate?.id || "custom"}` : selectedId,
      projectId,
      projectName,
    });

    if (setupMode === "template" && selectedTemplate) {
      query.set("template", selectedTemplate.id);
    }

    router.push(`/editor?${query.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(120deg,#f8fafc_0%,#eef2ff_55%,#e0f2fe_100%)] px-3 py-6 text-slate-900 sm:px-4 sm:py-10">
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-300/40 sm:p-6 md:p-10">
        <div className="mb-8">
          <div className="mb-4 flex justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 2</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Choose Size Or Template</h1>
              <p className="mt-2 text-sm text-slate-600">
                Project: <span className="font-semibold">{projectName || "Untitled Project"}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                clearAuthSession();
                router.replace("/signin");
              }}
              className="h-fit rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>

          <div className="inline-flex rounded-xl border border-slate-300 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setSetupMode("size")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                setupMode === "size" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Choose Page Size
            </button>
            <button
              type="button"
              onClick={() => setSetupMode("template")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                setupMode === "template" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Use Template
            </button>
          </div>
        </div>

        {setupMode === "size" ? (
          <>
            <section className="mb-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Orientation</h2>
              <div className="inline-flex w-full max-w-sm rounded-xl border border-slate-300 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setOrientation("portrait")}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    orientation === "portrait" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation("landscape")}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    orientation === "landscape" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Landscape
                </button>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Preset Sizes</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PAGE_PRESETS.map((preset) => {
                  const isSelected = preset.id === selectedId;
                  const oriented = applyOrientation(preset.width, preset.height, orientation);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedId(preset.id)}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        isSelected
                          ? "border-sky-500 bg-sky-50 shadow-md shadow-sky-200/60"
                          : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/40"
                      }`}
                    >
                      <p className="text-sm font-semibold">{preset.label}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {oriented.width} x {oriented.height} px
                      </p>
                      <p className="mt-2 text-xs text-slate-500">{preset.description}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <input
                  type="radio"
                  name="size_mode"
                  checked={selectedId === CUSTOM_PRESET_ID}
                  onChange={() => setSelectedId(CUSTOM_PRESET_ID)}
                />
                Others (Custom)
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  Width (px)
                  <input
                    type="number"
                    min={100}
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none ring-sky-300 focus:ring"
                  />
                </label>
                <label className="text-sm">
                  Height (px)
                  <input
                    type="number"
                    min={100}
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none ring-sky-300 focus:ring"
                  />
                </label>
              </div>
            </section>
          </>
        ) : (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Templates</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {EDITOR_TEMPLATES.map((template) => {
                const isSelected = template.id === selectedTemplateId;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      isSelected
                        ? "border-sky-500 bg-sky-50 shadow-md shadow-sky-200/60"
                        : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/40"
                    }`}
                  >
                    <p className="text-sm font-semibold">{template.name}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {template.width} x {template.height} px [{template.orientation}]
                    </p>
                    <p className="mt-2 text-xs text-slate-500">{template.description}</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-700">
            Selected: <span className="font-semibold">{selectedCanvasConfig.label}</span> ({selectedCanvasConfig.width} x{" "}
            {selectedCanvasConfig.height}) <span className="text-slate-500">[{selectedCanvasConfig.orientation}]</span>
          </p>
          <button
            type="button"
            onClick={goToEditor}
            disabled={!selectedCanvasConfig.isValid}
            className="w-full rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Start Designing
          </button>
        </div>
      </div>
    </main>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" />}>
      <SetupPageContent />
    </Suspense>
  );
}
