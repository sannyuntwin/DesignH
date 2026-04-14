"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuthSession, readAuthSession } from "@/lib/auth-session";
import { createProject, deleteProject, loadProjects, ProjectRecord } from "@/lib/projects";

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRecord[]>(() => loadProjects());
  const [projectName, setProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const isAdmin = Boolean(readAuthSession()?.isAdmin);

  useEffect(() => {
    if (!readAuthSession()) {
      router.replace("/signin");
    }
  }, [router]);

  const hasProjects = projects.length > 0;

  const handleCreateProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = projectName.trim();
    if (!trimmed) return;

    setIsCreating(true);
    const created = createProject(trimmed);
    setProjects(loadProjects());
    setProjectName("");

    const query = new URLSearchParams({
      projectId: created.id,
      projectName: created.name,
      pick: "1",
    });
    router.push(`/setup?${query.toString()}`);
  };

  const projectCards = useMemo(
    () =>
      projects.map((project) => (
        <article key={project.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">{project.name}</p>
          <p className="mt-1 text-xs text-slate-500">Updated: {formatDate(project.updatedAt)}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (project.lastConfig) {
                  const query = new URLSearchParams({
                    label: project.name,
                    w: String(project.lastConfig.width),
                    h: String(project.lastConfig.height),
                    o: project.lastConfig.orientation,
                    preset: project.lastConfig.preset,
                    projectId: project.id,
                    projectName: project.name,
                  });
                  if (project.lastConfig.templateId) {
                    query.set("template", project.lastConfig.templateId);
                  }
                  router.push(`/editor?${query.toString()}`);
                  return;
                }

                const query = new URLSearchParams({
                  projectId: project.id,
                  projectName: project.name,
                  pick: "1",
                });
                router.push(`/setup?${query.toString()}`);
              }}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
            >
              Open
            </button>
            <button
              type="button"
              onClick={() => {
                const query = new URLSearchParams({
                  projectId: project.id,
                  projectName: project.name,
                  pick: "1",
                });
                router.push(`/setup?${query.toString()}`);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Setup
            </button>
            <button
              type="button"
              onClick={() => {
                deleteProject(project.id);
                setProjects(loadProjects());
              }}
              className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              Delete
            </button>
          </div>
        </article>
      )),
    [projects, router],
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#eef2ff_42%,#f8fafc_100%)] px-3 py-6 text-slate-900 sm:px-4 sm:py-10">
      <section className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-300/40 sm:p-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Projects</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Your Projects</h1>
            <p className="mt-2 text-sm text-slate-600">Create a project, then choose page size or a template.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin ? (
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                Admin Dashboard
              </button>
            ) : null}
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
        </div>

        <form onSubmit={handleCreateProject} className="mb-6 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="New project name"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-sky-300 focus:ring"
          />
          <button
            type="submit"
            disabled={isCreating || !projectName.trim()}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create
          </button>
        </form>

        {hasProjects ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{projectCards}</div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
            No projects yet. Create your first project above.
          </div>
        )}
      </section>
    </main>
  );
}
