"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearAuthSession, readAuthSession } from "@/lib/auth-session";
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

function SetupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forcePick = searchParams.get(FORCE_PICK_QUERY) === "1";

  const [selectedId, setSelectedId] = useState(DEFAULT_PAGE.id);
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [customWidth, setCustomWidth] = useState("1200");
  const [customHeight, setCustomHeight] = useState("1600");

  const selectedPreset = PAGE_PRESETS.find((preset) => preset.id === selectedId);

  useEffect(() => {
    if (!readAuthSession()) {
      router.replace("/signin");
    }
  }, [router]);

  useEffect(() => {
    if (!readAuthSession()) return;
    try {
      const raw = window.localStorage.getItem(PAGE_PREF_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw) as SavedPagePreference;
      if (!forcePick && saved.width >= 100 && saved.height >= 100) {
        const query = new URLSearchParams({
          label: saved.label || DEFAULT_PAGE.label,
          w: String(saved.width),
          h: String(saved.height),
          o: saved.orientation || "portrait",
          preset: saved.selectedId || DEFAULT_PAGE.id,
        });
        router.replace(`/editor?${query.toString()}`);
        return;
      }
    } catch {
      // Ignore malformed localStorage values and continue with defaults.
    }
  }, [forcePick, router]);

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

  const goToEditor = () => {
    if (!readAuthSession()) return;
    if (!selectedSize.isValid) return;

    const preference: SavedPagePreference = {
      selectedId,
      customWidth,
      customHeight,
      orientation,
      label: selectedSize.label,
      width: selectedSize.width,
      height: selectedSize.height,
    };
    window.localStorage.setItem(PAGE_PREF_KEY, JSON.stringify(preference));

    const query = new URLSearchParams({
      label: selectedSize.label,
      w: String(selectedSize.width),
      h: String(selectedSize.height),
      o: orientation,
      preset: selectedId,
    });

    router.push(`/editor?${query.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(120deg,#f8fafc_0%,#eef2ff_55%,#e0f2fe_100%)] px-3 py-6 text-slate-900 sm:px-4 sm:py-10">
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-300/40 sm:p-6 md:p-10">
        <div className="mb-8">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                clearAuthSession();
                router.replace("/signin");
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 1</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Choose Your Page Size First</h1>
          <p className="mt-2 text-sm text-slate-600">
            Pick a preset like A4/A3/Q4, or use <strong>Others</strong> to enter a custom size.
          </p>
        </div>

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

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-700">
            Selected: <span className="font-semibold">{selectedSize.label}</span> ({selectedSize.width} x {selectedSize.height}){" "}
            <span className="text-slate-500">[{orientation}]</span>
          </p>
          <button
            type="button"
            onClick={goToEditor}
            disabled={!selectedSize.isValid}
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
