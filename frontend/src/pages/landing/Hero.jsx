import { motion } from "motion/react";
import { Github } from "lucide-react";
import { Rails, Rule, LpButton } from "./primitives";
import { HERO, REPO_URL } from "./content";

const MotionDiv = motion.div;

const enter = (delay) => ({
  initial: { opacity: 0, y: 18, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay },
});

export default function Hero() {
  return (
    <section id="top">
      <Rails>
        <div className="flex flex-col items-center px-6 pt-24 pb-24 text-center md:pt-32 md:pb-28">
          <MotionDiv {...enter(0)}>
            <p className="text-sm text-brand">{HERO.eyebrow}</p>
          </MotionDiv>
          <MotionDiv {...enter(0.08)}>
            <h1 className="mt-4 font-display text-[2.6rem] leading-[1.05] font-medium tracking-tight text-black sm:text-5xl md:text-6xl dark:text-white">
              {HERO.titleStart}
              <br />
              {HERO.titleMid}
              <span className="text-brand">{HERO.titleAccent}</span>
            </h1>
          </MotionDiv>
          <MotionDiv {...enter(0.16)}>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-lp-text md:text-lg">{HERO.subtitle}</p>
          </MotionDiv>
          <MotionDiv {...enter(0.24)} className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <LpButton to="/auth">Get started</LpButton>
            <LpButton href={REPO_URL} variant="outline">
              View on GitHub
            </LpButton>
          </MotionDiv>
          <MotionDiv {...enter(0.32)} className="mt-14 flex items-center gap-3 text-sm text-lp-text">
            <Github className="size-4 text-lp-heading" />
            <span className="h-4 w-px bg-lp-line" />
            <span>{HERO.footnote}</span>
          </MotionDiv>
        </div>
      </Rails>

      <Rule markers />
      <Rails className="bg-lp-soft px-4 pt-10 pb-12 md:px-12 md:pt-12">
        <MotionDiv
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.35 }}
        >
          {/* Real screenshots of the Sagewell workspace (sample notebook), swapped with the theme. */}
          <div className="overflow-hidden rounded-xl border border-lp-line bg-lp-bg shadow-[0_20px_60px_-20px_rgb(0_0_0/0.18)]">
            <img
              src="/images/app-light.webp"
              alt="The Sagewell workspace: sources on the left, a document summary in the middle, and a dialogue with cited answers on the right"
              width={2160}
              height={1290}
              className="block h-auto w-full dark:hidden"
              loading="eager"
            />
            <img
              src="/images/app-dark.webp"
              alt="The Sagewell workspace in dark mode"
              width={2160}
              height={1290}
              className="hidden h-auto w-full dark:block"
              loading="eager"
            />
          </div>
        </MotionDiv>
      </Rails>
      <Rule markers />
    </section>
  );
}
