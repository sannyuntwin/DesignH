"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Gift, PartyPopper, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { loginWithGoogleIdToken, registerWithPassword } from "@/lib/auth-api";
import { readAuthSession, saveAuthSession } from "@/lib/auth-session";

const signUpMoments = [
  {
    icon: Gift,
    title: "Save the plans",
    copy: "Keep every detail together before the first guest walks through the door.",
  },
  {
    icon: Sparkles,
    title: "Set the mood",
    copy: "Colors, notes, and ideas stay ready for the moment the celebration starts.",
  },
  {
    icon: PartyPopper,
    title: "Share the joy",
    copy: "Bring more people into the room and let the birthday feel bigger than ever.",
  },
];

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (readAuthSession()) {
      router.replace("/projects");
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
        isAdmin: Boolean(result.user.is_admin),
        signedInAt: new Date().toISOString(),
      });
      router.push("/projects");
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
      isAdmin: Boolean(result.user.is_admin),
      signedInAt: new Date().toISOString(),
    });
    router.push("/projects");
  };

  return (
    <main className="min-h-screen bg-[#fff6ef] text-[#23181f]">
      <section className="relative min-h-screen overflow-hidden">
        <Image
          src="https://images.pexels.com/photos/1857157/pexels-photo-1857157.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Birthday balloons and decorations"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(118deg,rgba(18,12,20,0.82)_8%,rgba(18,12,20,0.44)_42%,rgba(255,93,115,0.35)_100%)]" />

        <div className="relative mx-auto grid min-h-screen w-full max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8 lg:py-8">
          <div className="order-2 flex items-center lg:order-1">
            <section className="w-full max-w-xl overflow-hidden rounded-[8px] border border-white/18 bg-[#fff8f2] text-[#23181f] shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
              <Image
                src="https://images.pexels.com/photos/7100323/pexels-photo-7100323.jpeg?auto=compress&cs=tinysrgb&w=1400"
                alt="Birthday decorations with balloons and cake"
                width={1400}
                height={900}
                className="h-52 w-full object-cover sm:h-60"
              />

              <div className="px-5 py-5 sm:px-6 sm:py-6">
                <div className="flex items-center gap-2 text-[#f05a5a]">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]">Create account</p>
                </div>

                <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">Join the birthday celebration.</h1>
                <p className="mt-2 text-sm leading-6 text-[#624753]">
                  Start with your name, save the setup, and keep every joyful detail ready for Miss Htet Htet Aung.
                </p>

                <form className="mt-6 space-y-3" onSubmit={handleSignUp}>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-[#4b3140]">Name</span>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-[8px] border border-[#efc0b4] bg-white px-3 py-3 text-sm outline-none ring-0 transition placeholder:text-[#b996a6] focus:border-[#ff7a7f]"
                    />
                  </label>

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
                      placeholder="Create a password"
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
                    {isSubmitting ? "Wrapping your invite..." : "Create account"}
                  </button>
                </form>

                <div className="mt-4 border-t border-[#f0d6ce] pt-4">
                  <GoogleAuthButton onCredential={handleGoogle} label="Continue with Google" />
                </div>

                {error && <p className="mt-3 text-center text-sm text-rose-600">{error}</p>}

                <p className="mt-5 border-t border-[#f0d6ce] pt-5 text-sm text-[#624753]">
                  Already have an account?{" "}
                  <Link href="/signin" className="font-semibold text-[#0f8f8c] transition hover:text-[#0c7673]">
                    Sign in
                  </Link>
                </p>
              </div>
            </section>
          </div>

          <div className="order-1 flex flex-col justify-between text-white lg:order-2">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffe27d]">Birthday Sign Up</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-[8px] border border-white/30 bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/16"
              >
                <ArrowLeft className="h-4 w-4" />
                Back home
              </Link>
            </div>

            <div className="max-w-2xl py-10 lg:py-16">
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#ffe27d]">
                <span className="rounded-[8px] border border-white/20 bg-black/20 px-3 py-1.5 backdrop-blur-sm">Happy birthday</span>
                <span className="rounded-[8px] border border-white/20 bg-black/20 px-3 py-1.5 backdrop-blur-sm">Miss Htet Htet Aung</span>
              </div>

              <h2 className="mt-6 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                Come in with confetti energy.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/86 sm:text-lg">
                Make your account, save your plans, and step into a birthday theme built to feel warm, bright, and unforgettable.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {signUpMoments.map(({ icon: Icon, title, copy }) => (
                  <article key={title} className="rounded-[8px] border border-white/18 bg-black/12 px-4 py-4 backdrop-blur-sm">
                    <Icon className="h-5 w-5 text-[#ffe27d]" />
                    <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/82">{copy}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="hidden text-sm text-white/82 lg:block">
              Every good birthday starts with one name on the guest list and a room full of intention.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
