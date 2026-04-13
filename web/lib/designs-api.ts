type DesignCanvasData = Record<string, unknown>;

export type DesignRecord = {
  id: string;
  name: string;
  description?: string | null;
  canvas_data?: DesignCanvasData | null;
  width: number;
  height: number;
  updated_at: string;
};

type DesignListResponse = {
  designs: DesignRecord[];
};

type DesignMutationPayload = {
  name?: string;
  description?: string;
  canvas_data?: DesignCanvasData;
  width?: number;
  height?: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function buildApiUrl(path: string, query?: Record<string, string | number | undefined>) {
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  const url = new URL(`${base}${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function requestWithAuth<T>(path: string, token: string, init?: RequestInit, query?: Record<string, string | number | undefined>) {
  const response = await fetch(buildApiUrl(path, query), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof payload?.detail === "string"
        ? payload.detail
        : typeof payload?.message === "string"
          ? payload.message
          : "Request failed";
    throw new Error(message);
  }

  return payload as T;
}

export function listDesigns(token: string, input?: { search?: string; page?: number; limit?: number }) {
  return requestWithAuth<DesignListResponse>("/api/designs/", token, undefined, {
    search: input?.search || "",
    page: input?.page ?? 1,
    limit: input?.limit ?? 100,
  });
}

export function createDesign(token: string, payload: DesignMutationPayload) {
  return requestWithAuth<DesignRecord>("/api/designs/", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDesign(token: string, designId: string, payload: DesignMutationPayload) {
  return requestWithAuth<DesignRecord>(`/api/designs/${designId}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
