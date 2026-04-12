"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginWithGoogleIdToken } from "@/lib/auth-api";
import { readAuthSession, saveAuthSession } from "@/lib/auth-session";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (readAuthSession()) {
      router.replace("/setup");
    }
  }, [router]);

  const handleContinueWithGoogle = async (idToken: string) => {
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
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#eef2ff_42%,#f8fafc_100%)] px-3 py-6 text-slate-900 sm:px-4 sm:py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-300/40 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Welcome</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Sign In To Start Designing</h1>
        <p className="mt-2 text-sm text-slate-600">
          Create an account or sign in, then choose page size and design your content.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/signin"
            className="rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Sign up
          </Link>
        </div>

        <div className="mt-4">
          <GoogleAuthButton onCredential={handleContinueWithGoogle} />
        </div>
      </section>
    </main>
  );
}
