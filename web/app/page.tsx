"use client";

import { CakeSlice, Gift, PartyPopper, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { loginWithGoogleIdToken } from "@/lib/auth-api";
import { readAuthSession, saveAuthSession } from "@/lib/auth-session";

const birthdayMoments = [
  {
    title: "Candles ready",
    copy: "One wish, one deep breath, and a room full of people waiting for the smile after the first slice.",
    image:
      "https://images.pexels.com/photos/1729808/pexels-photo-1729808.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    title: "Tables full",
    copy: "Bright fruit, soft frosting, glittering drinks, and that happy little chaos that only birthdays get right.",
    image:
      "https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    title: "Photos forever",
    copy: "The hug at the door, the laugh before the toast, the second everyone sings too loudly and means every word.",
    image:
      "https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
];

const partyNotes = [
  {
    icon: CakeSlice,
    title: "Sweet start",
    copy: "Bring the candles, the favorite flavors, and the kind of playlist that keeps cousins dancing.",
  },
  {
    icon: Gift,
    title: "Little surprises",
    copy: "Wrap the thoughtful things. Save the biggest reaction for the moment everyone leans in at once.",
  },
  {
    icon: PartyPopper,
    title: "Big finish",
    copy: "Leave room for confetti, hugs, and the final photo when the night is warm and a little blurry.",
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
      <section className="relative min-h-[82vh] overflow-hidden">
        <Image
          src="https://images.pexels.com/photos/1395967/pexels-photo-1395967.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Birthday cake with candles and decorations"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.58)_8%,rgba(0,0,0,0.24)_48%,rgba(255,87,94,0.28)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(255,246,239,0)_0%,rgba(255,246,239,0.92)_78%,#fff6ef_100%)]" />

        <div className="relative mx-auto flex min-h-[82vh] w-full max-w-6xl flex-col justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffe27d]">DesignH Birthday</p>
              <p className="mt-2 max-w-sm text-sm text-white/84">Cake, music, flowers, candles, photos, and one person at the center of it all.</p>
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
              <span className="rounded-[8px] border border-white/20 bg-black/20 px-3 py-1.5 backdrop-blur-sm">Birthday Theme</span>
              <span className="rounded-[8px] border border-white/20 bg-black/20 px-3 py-1.5 backdrop-blur-sm">Warm party night</span>
              <span className="rounded-[8px] border border-white/20 bg-black/20 px-3 py-1.5 backdrop-blur-sm">Happy memories only</span>
            </div>

            <h1 className="mt-6 max-w-2xl text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
              {"Happy birthday to you, Miss Htet Htet Aung."}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/86 sm:text-lg">
              Make the entrance feel special, the table feel full, and the night feel impossible to forget.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#join"
                className="rounded-[8px] bg-[#ffcf4d] px-5 py-3 text-sm font-semibold text-[#241404] transition hover:bg-[#ffd866]"
              >
                Start the surprise
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
          {birthdayMoments.map((moment) => (
            <article key={moment.title} className="overflow-hidden rounded-[8px] border border-[#f1c4ba] bg-[#fffaf6] shadow-[0_16px_40px_rgba(231,111,81,0.14)]">
              <Image src={moment.image} alt={moment.title} width={1200} height={800} className="h-64 w-full object-cover" />
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
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#fef08a]">For the big day</p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">
              Keep the room bright, the playlist moving, and the camera close.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/86">
              Everything should feel easy on a birthday. Warm greetings at the door. Candles on time. The right people in the frame.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {partyNotes.map(({ icon: Icon, title, copy }) => (
                <article key={title} className="rounded-[8px] border border-white/18 bg-black/12 px-4 py-4 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-[#fef08a]" />
                  <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/82">{copy}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[8px] border border-white/18 bg-[#fff8f2] text-[#23181f] shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <Image
              src="https://images.pexels.com/photos/7180794/pexels-photo-7180794.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Friends celebrating a birthday together"
              width={1200}
              height={800}
              className="h-56 w-full object-cover"
            />
            <div className="px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex items-center gap-2 text-[#f05a5a]">
                <Sparkles className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">Join the celebration</p>
              </div>

              <h3 className="mt-3 text-2xl font-semibold">Step in before the candles melt.</h3>
              <p className="mt-2 text-sm leading-6 text-[#624753]">
                Sign in, save the plans, and keep every birthday detail ready before the first song starts.
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
