"use client";

import { ClipboardList, MessageSquare, Rocket, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { loginWithGoogleIdToken } from "@/lib/auth-api";
import { readAuthSession, saveAuthSession } from "@/lib/auth-session";

const featuredMoments = [
  {
    title: "Ideas in motion",
    copy: "Capture concepts early, shape them quickly, and keep momentum from first draft to final delivery.",
  },
  {
    title: "Team alignment",
    copy: "Bring updates, files, and feedback into one place so everyone sees the same next step.",
  },
  {
    title: "Results that last",
    copy: "Track progress, preserve context, and make every handoff clear even when timelines get busy.",
  },
];

const workflowNotes = [
  {
    icon: ClipboardList,
    title: "Start clearly",
    copy: "Set priorities, assign owners, and keep kickoff details visible from day one.",
  },
  {
    icon: MessageSquare,
    title: "Share updates",
    copy: "Post meaningful progress notes so your team stays informed without extra meetings.",
  },
  {
    icon: Rocket,
    title: "Finish strong",
    copy: "Wrap tasks with clean documentation so the next phase starts faster and smoother.",
  },
];

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (readAuthSession()) {
      router.replace("/projects");
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
      isAdmin: Boolean(result.user.is_admin),
      signedInAt: new Date().toISOString(),
    });
    router.push("/projects");
  };

  return (
    <main className="bg-[#fff6ef] text-[#23181f]">
      <section className="relative min-h-[82vh] overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(255,187,120,0.28)_0%,rgba(255,187,120,0)_44%),radial-gradient(circle_at_78%_18%,rgba(19,154,150,0.25)_0%,rgba(19,154,150,0)_40%),linear-gradient(120deg,#1f1522_8%,#231520_52%,#38202c_100%)]">
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(255,246,239,0)_0%,rgba(255,246,239,0.92)_78%,#fff6ef_100%)]" />

        <div className="relative mx-auto flex min-h-[82vh] w-full max-w-6xl flex-col justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffe27d]">DesignH Workspace</p>
              <p className="mt-2 max-w-sm text-sm text-white/84">Plans, files, feedback, and focused collaboration in one shared space.</p>
            </div>
            <Link
              href="/signin"
              className="rounded-[8px] border border-white/65 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/18"
            >
              Sign in
            </Link>
          </div>

          <div className="max-w-3xl pb-16 pt-12 text-white sm:pb-24">
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#ffe27d]">
              <span className="rounded-[8px] border border-white/20 bg-black/20 px-3 py-1.5 backdrop-blur-sm">Project Hub</span>
              <span className="rounded-[8px] border border-white/20 bg-black/20 px-3 py-1.5 backdrop-blur-sm">Team-ready setup</span>
              <span className="rounded-[8px] border border-white/20 bg-black/20 px-3 py-1.5 backdrop-blur-sm">Clear daily progress</span>
            </div>

            <h1 className="mt-6 max-w-2xl text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
              Plan smarter and keep every project moving.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/86 sm:text-lg">
              Build a shared workflow where ideas, decisions, and deliverables are easy to find and easy to trust.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#join"
                className="rounded-[8px] bg-[#ffcf4d] px-5 py-3 text-sm font-semibold text-[#241404] transition hover:bg-[#ffd866]"
              >
                Start now
              </Link>
              <Link
                href="/signup"
                className="rounded-[8px] border border-white/70 bg-white px-5 py-3 text-sm font-semibold text-[#25131d] transition hover:bg-[#fff0f3]"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fff6ef] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-3">
          {featuredMoments.map((moment) => (
            <article key={moment.title} className="overflow-hidden rounded-[8px] border border-[#f1c4ba] bg-[#fffaf6] shadow-[0_16px_40px_rgba(231,111,81,0.14)]">
              <div className="h-20 w-full bg-[linear-gradient(90deg,#f7d4bf_0%,#fde8d8_45%,#d9f1ef_100%)]" />
              <div className="px-5 py-5">
                <h2 className="text-xl font-semibold text-[#23181f]">{moment.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#5e4451]">{moment.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="join" className="bg-[#0f8f8c] px-4 py-12 text-white sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#fef08a]">For every project</p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">
              Keep priorities visible, communication clear, and delivery on track.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/86">
              Teams do better work when context is organized, next actions are obvious, and updates stay consistent.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {workflowNotes.map(({ icon: Icon, title, copy }) => (
                <article key={title} className="rounded-[8px] border border-white/18 bg-black/12 px-4 py-4 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-[#fef08a]" />
                  <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/82">{copy}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[8px] border border-white/18 bg-[#fff8f2] text-[#23181f] shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="h-24 w-full bg-[linear-gradient(120deg,#ffd7cf_0%,#ffe9dc_40%,#dff6f5_100%)]" />
            <div className="px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex items-center gap-2 text-[#f05a5a]">
                <Sparkles className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">Join the workspace</p>
              </div>

              <h3 className="mt-3 text-2xl font-semibold">Step in and organize your work.</h3>
              <p className="mt-2 text-sm leading-6 text-[#624753]">
                Sign in, save your plans, and keep every project detail ready before the next deadline.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/signin"
                  className="rounded-[8px] bg-[#ff5d73] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#ff7386]"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-[8px] border border-[#efc0b4] bg-white px-4 py-3 text-center text-sm font-semibold text-[#23181f] transition hover:bg-[#fff5ee]"
                >
                  Sign up
                </Link>
              </div>

              <div className="mt-5 border-t border-[#f0d6ce] pt-5">
                <GoogleAuthButton onCredential={handleContinueWithGoogle} label="Continue with Google" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
