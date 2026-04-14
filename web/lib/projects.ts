export type ProjectConfig = {
  width: number;
  height: number;
  orientation: "portrait" | "landscape";
  preset: string;
  templateId?: string;
};

export type ProjectRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastConfig?: ProjectConfig;
};

const PROJECTS_STORAGE_KEY = "design-editor-projects-v1";

function getStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function normalizeProjects(value: unknown): ProjectRecord[] {
  if (!Array.isArray(value)) return [];

  const out: ProjectRecord[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Partial<ProjectRecord>;
    if (typeof record.id !== "string" || typeof record.name !== "string") continue;

    const createdAt = typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString();
    const updatedAt = typeof record.updatedAt === "string" ? record.updatedAt : createdAt;
    const config = record.lastConfig;
    const lastConfig =
      config &&
      typeof config === "object" &&
      Number.isFinite((config as ProjectConfig).width) &&
      Number.isFinite((config as ProjectConfig).height) &&
      (((config as ProjectConfig).orientation === "portrait") || (config as ProjectConfig).orientation === "landscape") &&
      typeof (config as ProjectConfig).preset === "string"
        ? {
            width: (config as ProjectConfig).width,
            height: (config as ProjectConfig).height,
            orientation: (config as ProjectConfig).orientation,
            preset: (config as ProjectConfig).preset,
            templateId:
              typeof (config as ProjectConfig).templateId === "string" ? (config as ProjectConfig).templateId : undefined,
          }
        : undefined;

    out.push({
      id: record.id,
      name: record.name.trim() || "Untitled Project",
      createdAt,
      updatedAt,
      lastConfig,
    });
  }

  return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function loadProjects(): ProjectRecord[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return [];
    return normalizeProjects(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveProjects(projects: ProjectRecord[]) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

export function upsertProject(project: ProjectRecord) {
  const projects = loadProjects();
  const existingIndex = projects.findIndex((item) => item.id === project.id);
  const existing = existingIndex >= 0 ? projects[existingIndex] : null;
  const next: ProjectRecord = {
    ...project,
    name: project.name.trim() || "Untitled Project",
    createdAt: existing?.createdAt || project.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    projects[existingIndex] = next;
  } else {
    projects.push(next);
  }

  saveProjects(projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  return next;
}

export function createProject(name: string) {
  const now = new Date().toISOString();
  const project: ProjectRecord = {
    id: `prj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim() || "Untitled Project",
    createdAt: now,
    updatedAt: now,
  };
  return upsertProject(project);
}

export function deleteProject(projectId: string) {
  const projects = loadProjects().filter((project) => project.id !== projectId);
  saveProjects(projects);
}

export function updateProjectConfig(projectId: string, config: ProjectConfig) {
  const projects = loadProjects();
  const target = projects.find((project) => project.id === projectId);
  if (!target) return;
  upsertProject({ ...target, lastConfig: config });
}
