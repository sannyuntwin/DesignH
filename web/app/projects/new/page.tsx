"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuthSession, readAuthSession } from "@/lib/auth-session";
import { createProject } from "@/lib/projects";

export default function NewProjectPage() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!readAuthSession()) {
      router.replace("/signin");
    }
  }, [router]);

  const handleCreateProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = projectName.trim();
    if (!trimmedName) return;

    setIsSubmitting(true);
    const project = createProject(trimmedName);
    const query = new URLSearchParams({
      projectId: project.id,
      projectName: project.name,
      pick: "1",
    });
    router.push(`/setup?${query.toString()}`);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#eef2ff_42%,#f8fafc_100%)] px-3 py-6 text-slate-900 sm:px-4 sm:py-10">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-300/40 sm:p-8">
        <div className="mb-5 flex justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 1</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Create Project</h1>
            <p className="mt-2 text-sm text-slate-600">Start by naming your project. Next, you can choose page size or a template.</p>
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

        <form onSubmit={handleCreateProject} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Project Name
            <input
              type="text"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="e.g. April Campaign Poster"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-sky-300 focus:ring"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !projectName.trim()}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </form>
      </section>
    </main>
  );
}
