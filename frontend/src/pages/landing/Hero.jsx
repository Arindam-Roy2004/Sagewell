import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { FileText, FileType2, Globe, StickyNote } from "lucide-react";
import { Container, DivideX, Dot, Badge, SubHeading, Button } from "./primitives";
import { HERO, REPO_URL } from "./content";

const MotionDiv = motion.div;

const SOURCE_MARKS = [FileText, FileType2, Globe, StickyNote];

function HeroText() {
  return (
    <Container className="border-divide flex flex-col items-center justify-center border-x px-4 pt-10 pb-10 md:pt-32 md:pb-20">
      <Badge text={HERO.eyebrow} />
      <h1 className="mt-4 text-center text-3xl font-medium tracking-tight text-black md:text-4xl lg:text-6xl dark:text-white">
        {HERO.titleStart}
        <br /> {HERO.titleMid}
        <span className="text-brand">{HERO.titleAccent}</span>
      </h1>
      <SubHeading className="mx-auto mt-6 max-w-lg">{HERO.subtitle}</SubHeading>
      <div className="mt-6 flex items-center gap-4">
        <Button to="/auth">Get started</Button>
        <Button variant="secondary" href="#how-it-works">
          See how it works
        </Button>
      </div>
      <div className="mt-6 flex items-center gap-2">
        <div className="flex items-center">
          {SOURCE_MARKS.map((Icon, i) => (
            <MotionDiv key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.05 * i }}>
              <Icon className="size-4 text-brand" strokeWidth={1.75} />
            </MotionDiv>
          ))}
        </div>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="border-l border-gray-500 pl-4 text-[10px] text-gray-600 transition-colors hover:text-black sm:text-sm dark:text-gray-300 dark:hover:text-white"
        >
          {HERO.openSource}
        </a>
      </div>
    </Container>
  );
}

const SPRING = { stiffness: 300, damping: 30 };

/** App screenshot that drifts a few pixels toward the cursor, over a hatched backdrop. */
function HeroImage() {
  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const x = useTransform(useSpring(mouseX, SPRING), [-0.5, 0.5], [-40, 40]);
  const y = useTransform(useSpring(mouseY, SPRING), [-0.5, 0.5], [-40, 40]);

  const handleMouseMove = (event) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((event.clientX - (rect.left + rect.width / 2)) / rect.width);
    mouseY.set((event.clientY - (rect.top + rect.height / 2)) / rect.height);
  };
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <Container className="border-divide relative flex items-start justify-start border-x bg-gray-100 p-2 perspective-distant md:p-4 lg:p-8 dark:bg-neutral-800">
      <Dot top left />
      <Dot top right />
      <Dot bottom left />
      <Dot bottom right />
      <div className="relative w-full">
        <MotionDiv
          ref={ref}
          className="relative z-10 h-full w-full cursor-pointer"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ opacity: { duration: 0.3, delay: 1 } }}
          style={{ translateX: x, translateY: y }}
        >
          {/* Real screenshots of the Sagewell workspace, swapped with the theme. */}
          <img
            src="/images/app-light.webp"
            alt="The Sagewell workspace: sources on the left, a summary in the middle, and a conversation with cited answers on the right"
            width={2160}
            height={1290}
            draggable={false}
            className="w-full rounded-lg shadow-2xl dark:hidden"
          />
          <img
            src="/images/app-dark.webp"
            alt="The Sagewell workspace in dark mode"
            width={2160}
            height={1290}
            draggable={false}
            className="hidden w-full rounded-lg shadow-2xl dark:block"
          />
        </MotionDiv>
        <div className="absolute inset-0 z-0 m-auto h-[90%] w-[95%] rounded-lg border border-(--pattern-fg) bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed" />
      </div>
    </Container>
  );
}

export default function Hero() {
  return (
    <section id="top">
      <DivideX />
      <HeroText />
      <DivideX />
      <HeroImage />
      <DivideX />
    </section>
  );
}
