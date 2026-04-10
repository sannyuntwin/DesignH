"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithGoogleIdToken, registerWithPassword } from "@/lib/auth-api";
import { readAuthSession, saveAuthSession } from "@/lib/auth-session";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (readAuthSession()) {
      router.replace("/setup");
    }
  }, [router]);

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;

    try {
      setError(null);
      setIsSubmitting(true);
      const result = await registerWithPassword(name.trim(), email.trim(), password);
      saveAuthSession({
        provider: "password",
        name: result.user.name || result.user.email,
        email: result.user.email,
        avatar: "https://www.gravatar.com/avatar/?d=mp",
        token: result.token,
        signedInAt: new Date().toISOString(),
      });
      router.push("/setup");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign up failed");
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
      signedInAt: new Date().toISOString(),
    });
    router.push("/setup");
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#eef2ff_42%,#f8fafc_100%)] px-4 py-10 text-slate-900">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-xl shadow-slate-300/40">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Account</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Sign up</h1>

        <form className="mt-6 space-y-3" onSubmit={handleSignUp}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-sky-300 focus:ring"
          />
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
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="mt-3">
          <GoogleAuthButton onCredential={handleGoogle} />
        </div>

        {error && <p className="mt-3 text-center text-sm text-rose-600">{error}</p>}

        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-sky-700 hover:text-sky-800">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
