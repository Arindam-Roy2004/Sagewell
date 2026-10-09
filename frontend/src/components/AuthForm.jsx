// Sign-in / sign-up page in the landing page's layout: copy and the Google button on the left,
// a photo card on the right. Google is the only sign-in method; the same button also
// creates new accounts, so "sign up" only changes the wording.
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Loader2, ShieldCheck, Quote } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import GoogleSignInButton from "./GoogleSignInButton";
import LeafIcon from "./icons/leaf-icon";
import Navbar from "../pages/landing/Navbar";
import Footer from "../pages/landing/Footer";

const MotionDiv = motion.div;
const GOOGLE_CONFIGURED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

// Photo: Thomas Franke on Unsplash (Unsplash License: free to use).
const PHOTO = {
  src: "/images/auth-library.webp",
  alt: "An open book floating above stacks of books in a dimly lit library",
  credit: "Thomas Franke",
  creditUrl: "https://unsplash.com/@thomas094?utm_source=sagewell&utm_medium=referral",
  pageUrl: "https://unsplash.com/photos/view-of-floating-open-book-from-stacked-books-in-library-HH4WBGNyltc?utm_source=sagewell&utm_medium=referral",
};

const COPY = {
  signin: {
    title: "Welcome back!",
    subtitle: "Sign in to pick up where you left off. Your sources and dialogues are waiting.",
    switchText: "Don’t have an account?",
    switchLabel: "Sign up",
  },
  signup: {
    title: "Create an account",
    subtitle: "Add your documents, ask questions in plain language, and get answers that cite their sources.",
    switchText: "Already have an account?",
    switchLabel: "Sign in",
  },
};

const enter = (delay) => ({
  initial: { opacity: 0, y: 14, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay },
});

export default function AuthForm() {
  const { googleLogin, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin");
  const iconRef = useRef(null);
  const copy = COPY[mode];

  const handleGoogle = async (credential) => {
    const result = await googleLogin(credential);
    if (result.success) {
      navigate("/workspace", { replace: true });
    }
  };

  return (
    <div className="landing-theme flex min-h-screen flex-col overflow-x-clip bg-lp-bg font-landing text-lp-text antialiased selection:bg-brand/25">
      <Navbar basePath="/" />

      <main className="flex-1 border-b border-lp-line">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:py-20 lg:grid-cols-2 lg:gap-20 lg:px-4">
          {/* Left: copy + sign-in */}
          <div className="mx-auto w-full max-w-[400px] lg:mx-0">
            <MotionDiv {...enter(0)}>
              <span
                className="inline-flex text-lp-heading"
                onMouseEnter={() => iconRef.current?.startAnimation()}
                onMouseLeave={() => iconRef.current?.stopAnimation()}
              >
                <LeafIcon ref={iconRef} size={26} strokeWidth={2.4} className="text-brand" />
              </span>
            </MotionDiv>

            <MotionDiv key={`title-${mode}`} {...enter(0.05)}>
              <h1 className="mt-5 font-display text-4xl font-normal tracking-tight text-black md:text-[40px] dark:text-white">
                {copy.title}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-lp-text">{copy.subtitle}</p>
            </MotionDiv>

            <MotionDiv {...enter(0.12)} className="mt-9">
              {GOOGLE_CONFIGURED ? (
                <div className="w-full">
                  <GoogleSignInButton onCredential={handleGoogle} lightTheme="filled_black" darkTheme="outline" />
                </div>
              ) : (
                <p className="rounded-lg border border-lp-line bg-lp-soft px-4 py-3 text-[14px] text-lp-heading">
                  Google sign-in isn’t configured. Set <code className="font-dm-mono text-[13px]">VITE_GOOGLE_CLIENT_ID</code> in the
                  frontend environment.
                </p>
              )}

              <div className="mt-3 flex h-5 items-center justify-center" aria-live="polite">
                {isLoading && (
                  <span className="flex items-center gap-2 text-[13px] text-lp-text">
                    <Loader2 className="size-3.5 animate-spin" /> Signing you in…
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm text-lp-text">
                <span className="h-px flex-1 bg-lp-line" />
                <span className="flex items-center gap-1.5 text-[13px]">
                  <ShieldCheck className="size-3.5" /> Secure sign-in with Google
                </span>
                <span className="h-px flex-1 bg-lp-line" />
              </div>

              <p className="mt-5 text-center text-[13px] leading-relaxed text-lp-text">
                We use your Google name, email and profile picture to set up your account. No password is stored.
              </p>

              <p className="mt-8 text-center text-[15px] text-lp-text">
                {copy.switchText}{" "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="text-brand underline-offset-4 hover:underline cursor-pointer"
                >
                  {copy.switchLabel}
                </button>
              </p>
            </MotionDiv>
          </div>

          {/* Right: photo card */}
          <MotionDiv
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
            className="hidden lg:block"
          >
            <figure>
              <div className="relative aspect-[528/607] w-full overflow-hidden rounded-2xl bg-neutral-900 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.35)]">
                <img src={PHOTO.src} alt={PHOTO.alt} className="absolute inset-0 size-full object-cover" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />

                <div className="absolute right-8 bottom-8 left-8">
                  <div className="flex flex-wrap gap-2">
                    {["Research", "Citations"].map((tag) => (
                      <span key={tag} className="rounded-[5px] bg-black/55 px-2 py-1 text-[12px] text-white backdrop-blur-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 max-w-sm rounded-xl border border-white/10 bg-black/45 p-4 text-white backdrop-blur-md">
                    <Quote className="size-4 text-white/60" />
                    <p className="mt-2 text-[16px] leading-relaxed">
                      Every answer points back to the passage it came from, so you can always check the source.
                    </p>
                    <p className="mt-3 text-[13px] text-white/60">
                      Sagewell, <span className="font-medium text-white/80">grounded answers</span>
                    </p>
                  </div>
                </div>
              </div>
              <figcaption className="mt-2 text-right text-[12px] text-lp-text">
                Photo by{" "}
                <a href={PHOTO.creditUrl} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                  {PHOTO.credit}
                </a>{" "}
                on{" "}
                <a href={PHOTO.pageUrl} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                  Unsplash
                </a>
              </figcaption>
            </figure>
          </MotionDiv>
        </div>
      </main>

      <Footer basePath="/" />
    </div>
  );
}
