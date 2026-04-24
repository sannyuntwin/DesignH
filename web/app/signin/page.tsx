"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck, Sparkles, Stars } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { loginWithGoogleIdToken, loginWithPassword } from "@/lib/auth-api";
import { readAuthSession, saveAuthSession } from "@/lib/auth-session";

const signInNotes = [
  "Access your saved projects",
  "Pick up right where you left off",
  "Keep your team in sync",
];

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
    <main className="min-h-screen bg-[#fff6ef] text-[#23181f]">
      <section className="relative min-h-screen overflow-hidden">
        <Image
          src="https://images.pexels.com/photos/796606/pexels-photo-796606.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Workspace table with warm lights"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(24,11,18,0.8)_10%,rgba(24,11,18,0.45)_44%,rgba(15,143,140,0.42)_100%)]" />

        <div className="relative mx-auto grid min-h-screen w-full max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-8">
          <div className="flex flex-col justify-between text-white">
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-[8px] border border-white/30 bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/16"
              >
                <ArrowLeft className="h-4 w-4" />
                Back home
              </Link>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffe27d]">Workspace Sign In</p>
            </div>

            <div className="max-w-2xl py-10 lg:py-16">
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#ffe27d]">
                <span className="rounded-[8px] border border-white/20 bg-black/20 px-3 py-1.5 backdrop-blur-sm">Secure access</span>
                <span className="rounded-[8px] border border-white/20 bg-black/20 px-3 py-1.5 backdrop-blur-sm">Fast return</span>
              </div>

              <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                Sign back in and continue your work.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/86 sm:text-lg">
                Your projects, notes, and team updates are ready whenever you are.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {signInNotes.map((note, index) => (
                  <div key={note} className="rounded-[8px] border border-white/18 bg-black/12 px-4 py-4 backdrop-blur-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ffe27d]">0{index + 1}</div>
                    <p className="mt-3 text-sm leading-6 text-white/84">{note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden items-center gap-3 pb-2 text-sm text-white/82 lg:flex">
              <ShieldCheck className="h-4 w-4 text-[#ffe27d]" />
              <span>Focused flow, clear updates, steady delivery.</span>
            </div>
          </div>

          <div className="flex items-center lg:justify-end">
            <section className="w-full max-w-xl overflow-hidden rounded-[8px] border border-white/18 bg-[#fff8f2] text-[#23181f] shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
              <Image
                src="https://images.pexels.com/photos/1729796/pexels-photo-1729796.jpeg?auto=compress&cs=tinysrgb&w=1400"
                alt="Close-up workspace details"
                width={1400}
                height={900}
                className="h-52 w-full object-cover sm:h-60"
              />

              <div className="px-5 py-5 sm:px-6 sm:py-6">
                <div className="flex items-center gap-2 text-[#f05a5a]">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]">Welcome back</p>
                </div>

                <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Sign in to continue your workflow.</h2>
                <p className="mt-2 text-sm leading-6 text-[#624753]">
                  Pick up your plans, messages, and every project detail you already saved.
                </p>

                <form className="mt-6 space-y-3" onSubmit={handleSignIn}>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-[#4b3140]">Email</span>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-[8px] border border-[#efc0b4] bg-white px-3 py-3 text-sm outline-none ring-0 transition placeholder:text-[#b996a6] focus:border-[#ff7a7f]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-[#4b3140]">Password</span>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-[8px] border border-[#efc0b4] bg-white px-3 py-3 text-sm outline-none ring-0 transition placeholder:text-[#b996a6] focus:border-[#ff7a7f]"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-[8px] bg-[#ff5d73] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ff7083] disabled:cursor-not-allowed disabled:bg-[#f3a0aa]"
                  >
                    {isSubmitting ? "Signing you in..." : "Sign in"}
                  </button>
                </form>

                <div className="mt-4 border-t border-[#f0d6ce] pt-4">
                  <GoogleAuthButton onCredential={handleGoogle} label="Continue with Google" />
                </div>

                {error && <p className="mt-3 text-center text-sm text-rose-600">{error}</p>}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0d6ce] pt-5">
                  <p className="text-sm text-[#624753]">
                    New here?{" "}
                    <Link href="/signup" className="font-semibold text-[#0f8f8c] transition hover:text-[#0c7673]">
                      Create an account
                    </Link>
                  </p>
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-[#f05a5a]">
                    <Stars className="h-4 w-4" />
                    <span>Keep the momentum going</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
