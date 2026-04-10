export const AUTH_SESSION_KEY = "design-editor-auth-v1";

export type AuthSession = {
  provider: "google" | "password";
  name: string;
  email: string;
  avatar: string;
  token: string;
  signedInAt: string;
};

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
