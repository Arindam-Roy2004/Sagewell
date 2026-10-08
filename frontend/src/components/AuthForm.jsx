// Sign-in page. Google is the only sign-in method; the same button creates new accounts.
// Uses the landing page's visual system (railed column, section rules, coral accent).
import "@fontsource-variable/inter/opsz.css";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";

import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, Lock, Github, Loader2 } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import GoogleSignInButton from "./GoogleSignInButton";
import ThemeToggle from "./ThemeToggle";
import LeafIcon from "./icons/leaf-icon";
import { Rails, Rule, Reveal } from "../pages/landing/primitives";
import { REPO_URL } from "../pages/landing/content";

const GOOGLE_CONFIGURED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

const FACTS = [
  { icon: KeyRound, title: "No password to remember", text: "Your Google account is your key. Nothing extra to create or reset." },
  { icon: Lock, title: "Private notebooks", text: "Your sources and dialogues are visible only to your account." },
  { icon: Github, title: "Open source", text: "See exactly how sign-in and your data are handled on GitHub." },
];

function Logo() {
  const iconRef = useRef(null);
  return (
    <Link
      to="/"
      className="flex items-center gap-2 text-lp-heading"
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
      aria-label="Sagewell home"
    >
      <LeafIcon ref={iconRef} size={22} strokeWidth={2.4} className="text-brand" />
      <span className="font-display text-2xl font-medium tracking-tight">Sagewell</span>
    </Link>
  );
}

export default function AuthForm() {
  const { googleLogin, isLoading } = useAuthStore();
  const navigate = useNavigate();

  // Same 16px root as the landing page so the 1280px column lines up.
  useEffect(() => {
    document.documentElement.classList.add("lp-root");
    return () => document.documentElement.classList.remove("lp-root");
  }, []);

  const handleGoogle = async (credential) => {
    const result = await googleLogin(credential);
    if (result.success) {
      navigate("/workspace", { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-lp-bg font-landing text-lp-text antialiased selection:bg-brand/25">
      <header className="w-full border-b border-lp-line">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-6 md:px-4">
          <Logo />
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden items-center gap-1.5 text-[15px] text-lp-text transition-colors hover:text-lp-heading sm:flex"
            >
              <ArrowLeft className="size-4" /> Back to home
            </Link>
            <ThemeToggle className="text-lp-text hover:bg-lp-soft hover:text-lp-heading" />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Rails>
          <div className="flex flex-col items-center px-6 pt-20 pb-16 text-center md:pt-24">
            <Reveal>
              <p className="text-sm text-brand">Sign in</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-3 font-display text-4xl leading-[1.08] font-normal tracking-tight text-lp-heading md:text-5xl">
                Welcome to Sagewell
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-lp-text">
                Continue with your Google account to open your notebooks. New here? The same button creates your
                account.
              </p>
            </Reveal>
          </div>
        </Rails>

        <Rule markers />
        <Rails className="bg-lp-soft px-6 py-14 md:py-16">
          <Reveal delay={0.15} className="mx-auto w-full max-w-md">
            <div className="rounded-xl border border-lp-line bg-lp-bg p-8 shadow-[0_20px_60px_-24px_rgb(0_0_0/0.18)]">
              <p className="text-center font-dm-mono text-[13px] uppercase tracking-wide text-lp-text">Continue with</p>

              <div className="mt-5 w-full">
                {GOOGLE_CONFIGURED ? (
                  <GoogleSignInButton onCredential={handleGoogle} lightTheme="filled_black" darkTheme="outline" />
                ) : (
                  <p className="rounded-lg border border-lp-line bg-lp-soft px-4 py-3 text-center text-[14px] text-lp-heading">
                    Google sign-in isn’t configured. Set <code className="font-dm-mono text-[13px]">VITE_GOOGLE_CLIENT_ID</code> in
                    the frontend environment.
                  </p>
                )}
              </div>

              <div className="mt-4 flex h-5 items-center justify-center" aria-live="polite">
                {isLoading && (
                  <span className="flex items-center gap-2 text-[13px] text-lp-text">
                    <Loader2 className="size-3.5 animate-spin" /> Signing you in…
                  </span>
                )}
              </div>

              <div className="mt-4 border-t border-lp-line pt-5 text-center text-[13px] leading-relaxed text-lp-text">
                Sagewell uses your Google name, email and profile picture to set up your account. No password is
                stored.
              </div>
            </div>
          </Reveal>
        </Rails>
        <Rule markers />

        <Rails>
          <div className="grid md:grid-cols-3">
            {FACTS.map(({ icon: Icon, title, text }, i) => (
              <Reveal
                key={title}
                delay={i * 0.06}
                className={`px-8 py-10 ${i < 2 ? "border-b border-lp-line md:border-r md:border-b-0" : ""}`}
              >
                <h2 className="flex items-center gap-2.5 font-landing text-[17px] font-normal tracking-normal text-lp-heading">
                  <Icon className="size-[18px]" /> {title}
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-lp-text">{text}</p>
              </Reveal>
            ))}
          </div>
        </Rails>
        <Rule />
      </main>

      <footer className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-[14px] text-lp-link sm:flex-row md:px-4">
        <p>© {new Date().getFullYear()} Sagewell. Open source.</p>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-lp-heading">
          GitHub
        </a>
      </footer>
    </div>
  );
}
