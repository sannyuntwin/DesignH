"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithGoogleIdToken, loginWithPassword } from "@/lib/auth-api";
import { readAuthSession, saveAuthSession } from "@/lib/auth-session";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (readAuthSession()) {
      router.replace("/projects");
    }
  }, [router]);

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;

    try {
      setError(null);
      setIsSubmitting(true);
      const result = await loginWithPassword(email.trim(), password);
      saveAuthSession({
        provider: "password",
        name: result.user.name || result.user.email,
        email: result.user.email,
        avatar: "https://www.gravatar.com/avatar/?d=mp",
        token: result.token,
        isAdmin: Boolean(result.user.is_admin),
        signedInAt: new Date().toISOString(),
      });
      router.push("/projects");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async (idToken: string) => {
    const result = await loginWithGoogleIdToken(idToken);
    saveAuthSession({
      provider: "google",
      name: result.user.name || result.user.email,
      email: result.user.email,
      avatar: "https://www.gravatar.com/avatar/?d=mp",
      token: result.token,
      isAdmin: Boolean(result.user.is_admin),
      signedInAt: new Date().toISOString(),
    });
    router.push("/projects");
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#eef2ff_42%,#f8fafc_100%)] px-3 py-6 text-slate-900 sm:px-4 sm:py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-300/40 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Account</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Sign in</h1>

        <form className="mt-6 space-y-3" onSubmit={handleSignIn}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-sky-300 focus:ring"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-sky-300 focus:ring"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-3">
          <GoogleAuthButton onCredential={handleGoogle} />
        </div>

        {error && <p className="mt-3 text-center text-sm text-rose-600">{error}</p>}

        <p className="mt-4 text-center text-sm text-slate-600">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-sky-700 hover:text-sky-800">
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
}
