export const AUTH_SESSION_KEY = "design-editor-auth-v1";

export type AuthSession = {
  provider: "google" | "password";
  name: string;
  email: string;
  avatar: string;
  token: string;
  isAdmin?: boolean;
  signedInAt: string;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(normalized);
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readIsAdminFromToken(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  return Boolean(payload.isAdmin ?? payload.is_admin ?? payload.admin);
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthSession>;

    if (parsed.provider !== "google" && parsed.provider !== "password") return null;
    if (typeof parsed.email !== "string" || typeof parsed.name !== "string") return null;
    if (typeof parsed.token !== "string" || !parsed.token) return null;

    return {
      provider: parsed.provider,
      name: parsed.name,
      email: parsed.email,
      avatar: typeof parsed.avatar === "string" ? parsed.avatar : "",
      token: parsed.token,
      isAdmin:
        typeof parsed.isAdmin === "boolean" ? parsed.isAdmin : readIsAdminFromToken(parsed.token),
      signedInAt: typeof parsed.signedInAt === "string" ? parsed.signedInAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_SESSION_KEY);
}
