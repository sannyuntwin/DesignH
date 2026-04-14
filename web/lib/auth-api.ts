export type ApiUser = {
  id: string;
  email: string;
  name: string | null;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
  last_login?: string | null;
};

export type AuthResponse = {
  message: string;
  token: string;
  user: ApiUser;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function apiUrl(path: string) {
  return `${API_BASE}${path}`;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

export function loginWithPassword(email: string, password: string) {
  return postJson<AuthResponse>("/api/auth/login", { email, password });
}

export function registerWithPassword(name: string, email: string, password: string) {
  return postJson<AuthResponse>("/api/auth/register", { name, email, password });
}

export function loginWithGoogleIdToken(idToken: string) {
  return postJson<AuthResponse>("/api/auth/google", { id_token: idToken });
}
