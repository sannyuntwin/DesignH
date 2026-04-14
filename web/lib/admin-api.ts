export type AdminOverviewStats = {
  users: number;
  designs: number;
  templates: number;
  admins: number;
};

export type AdminUserRecord = {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
  created_at: string | null;
  last_login: string | null;
};

export type AdminDesignRecord = {
  id: string;
  name: string;
  owner_email: string | null;
  width: number;
  height: number;
  updated_at: string | null;
};

export type AdminOverviewResponse = {
  stats: AdminOverviewStats;
  recent_users: AdminUserRecord[];
  recent_designs: AdminDesignRecord[];
};

export type AdminUsersResponse = {
  users: AdminUserRecord[];
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

async function requestWithAuth<T>(
  path: string,
  token: string,
  init?: RequestInit,
  query?: Record<string, string | number | undefined>,
) {
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

export function fetchAdminOverview(token: string) {
  return requestWithAuth<AdminOverviewResponse>("/api/admin/overview", token);
}

export function fetchAdminUsers(token: string, limit = 50) {
  return requestWithAuth<AdminUsersResponse>("/api/admin/users", token, undefined, { limit });
}
