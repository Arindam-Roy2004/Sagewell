import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { BookOpen, FileText, Globe, StickyNote, Quote, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container, DivideX, Badge, SectionHeading, SubHeading, PixelatedCanvas, Scale } from "./primitives";
import { CurveLeft, CurveRight, DropLine } from "./lines";
import { IntegrationsIcon, ThirdIcon, SecondIcon, MouseBoxIcon } from "./icons";
import { HOW_IT_WORKS } from "./content";

const MotionDiv = motion.div;
const MotionSpan = motion.span;

const SPRING = { stiffness: 300, damping: 30 };
const TAB_MS = 8000;

const TONES = {
  default: "border-blue-500 bg-blue-50 text-blue-500 dark:bg-blue-50/10 dark:text-blue-500",
  danger: "border-orange-500 bg-red-50 text-orange-500 dark:bg-red-50/10 dark:text-red-500",
  success: "border-neutral-500 bg-neutral-50 text-neutral-500 dark:bg-neutral-50/10 dark:text-neutral-500",
  ready: "border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-50/10 dark:text-emerald-500",
};

/** Node card on a hatched backdrop. The inner card leans a little toward the cursor. */
function TechCard({ title, subtitle, logo, cta, tone = "default", className, delay = 0 }) {
  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const x = useTransform(useSpring(mouseX, SPRING), [-0.5, 0.5], [-20, 20]);
  const y = useTransform(useSpring(mouseY, SPRING), [-0.5, 0.5], [-20, 20]);

  return (
    <MotionDiv
      ref={ref}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      className={cn("relative h-full text-xs", className)}
    >
      <Scale />
      <div className="absolute inset-x-0 -top-1.5 mx-auto size-3 rounded-full border-2 border-gray-300 bg-white dark:border-neutral-700 dark:bg-neutral-900" />
      <MotionDiv
        onMouseMove={(event) => {
          if (!ref.current) return;
          const rect = ref.current.getBoundingClientRect();
          mouseX.set((event.clientX - (rect.left + rect.width / 2)) / rect.width);
          mouseY.set((event.clientY - (rect.top + rect.height / 2)) / rect.height);
        }}
        onMouseLeave={() => {
          mouseX.set(0);
          mouseY.set(0);
        }}
        style={{ translateX: x, translateY: y }}
        className="shadow-aceternity relative z-20 flex w-54 shrink-0 flex-col items-start rounded-lg bg-white dark:bg-neutral-900"
      >
        <div className="flex w-full items-center justify-between p-2 md:p-4">
          <div className="flex items-center gap-2 font-medium">
            {logo}
            {title}
          </div>
          <p className="font-mono text-gray-600">{subtitle}</p>
        </div>
        <DivideX />
        <div className={cn("m-4 rounded-sm border px-2 py-0.5", TONES[tone])}>{cta}</div>
      </MotionDiv>
    </MotionDiv>
  );
}

const cardIcon = "size-4 shrink-0";

/** Step 1: a notebook fed by three sources. */
function SourcesSkeleton() {
  return (
    <div className="mt-12 flex flex-col items-center">
      <div className="relative">
        <TechCard title="Notebook" subtitle="3 sources" logo={<BookOpen className={cardIcon} />} cta="Indexing" tone="default" />
        <CurveLeft className="absolute top-12 -left-32" />
        <CurveRight className="absolute top-12 -right-32" />
        <DropLine className="absolute top-24 right-[107px]" />
      </div>
      <div className="mt-12 flex flex-row gap-4.5">
        <TechCard title="PDF" subtitle="2.4 MB" logo={<FileText className={cardIcon} />} cta="Ready" tone="ready" delay={0.2} />
        <TechCard title="Web page" subtitle="article" logo={<Globe className={cardIcon} />} cta="Reading" tone="danger" delay={0.4} />
        <TechCard title="Notes" subtitle="pasted" logo={<StickyNote className={cardIcon} />} cta="Ready" tone="success" delay={0.6} />
      </div>
    </div>
  );
}

const QUESTION = "What did the study conclude about sleep and memory?";

/** Step 2: a question and the passages that answer it, joined by a live link. */
function AskSkeleton() {
  const [mounted, setMounted] = useState(false);
  const barWidth = useMemo(() => 100 * Math.random(), []);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="relative flex h-full w-full items-center justify-between">
      <MotionDiv
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative h-70 w-60 -translate-x-2 rounded-2xl border-t border-gray-300 bg-white p-4 shadow-2xl md:translate-x-0 dark:border-neutral-700 dark:bg-neutral-900"
      >
        <div className="absolute -top-4 -right-4 flex h-14 w-14 items-center justify-center rounded-lg bg-white shadow-xl dark:bg-neutral-800">
          <Scale />
          <MessageSquareText className="relative z-20 size-7 text-neutral-800 dark:text-neutral-100" strokeWidth={1.5} />
        </div>
        <div className="mt-12 flex items-center gap-2">
          <IntegrationsIcon className="dark:text-neutral-200" />
          <span className="text-charcoal-700 text-sm font-medium dark:text-neutral-200">Question</span>
        </div>
        <DivideX className="mt-2" />
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-charcoal-700 text-[10px] leading-loose font-normal md:text-xs dark:text-neutral-200">
            {QUESTION.split(/(\s+)/).map((word, i) => (
              <MotionSpan
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.02 * i, ease: "linear" }}
                className="inline-block"
              >
                {word === " " ? " " : word}
              </MotionSpan>
            ))}
          </span>
        </div>
        <div className="mt-2 flex flex-col">
          {[0, 1].map((i) => (
            <MotionDiv
              key={i}
              initial={{ width: "0%" }}
              animate={{ width: `${barWidth}%` }}
              transition={{ duration: 4, delay: 0.2 * i, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
              className="mt-2 h-4 w-full rounded-full bg-gray-200 dark:bg-neutral-800"
            />
          ))}
        </div>
      </MotionDiv>

      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute inset-x-0 z-30 hidden items-center justify-center md:flex"
      >
        <div className="size-3 rounded-full border-2 border-blue-500 bg-white dark:bg-neutral-800" />
        <div className="h-[2px] w-38 bg-blue-500" />
        <div className="size-3 rounded-full border-2 border-blue-500 bg-white dark:bg-neutral-800" />
      </MotionDiv>

      <MotionDiv
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="relative h-70 w-60 translate-x-10 rounded-2xl border-t border-gray-300 bg-white p-4 shadow-2xl md:translate-x-0 dark:border-neutral-700 dark:bg-neutral-900"
      >
        <div className="absolute -top-4 -left-4 flex h-14 w-14 items-center justify-center rounded-lg bg-white shadow-xl dark:bg-neutral-800">
          <Scale />
          <Quote className="relative z-20 size-7 text-brand" strokeWidth={1.5} />
        </div>
        <div className="mt-12 flex items-center gap-2">
          <IntegrationsIcon className="dark:text-neutral-200" />
          <span className="text-charcoal-700 text-xs font-medium md:text-sm dark:text-neutral-200">Citations</span>
          <span className="text-charcoal-700 rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200">
            3
          </span>
        </div>
        <DivideX className="mt-2" />
        {[
          { icon: FileText, name: "study.pdf", mark: "[1]" },
          { icon: StickyNote, name: "lecture notes", mark: "[2]" },
        ].map(({ icon: Icon, name, mark }) => (
          <div key={name} className="mt-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon className="size-4 shrink-0 text-neutral-700 dark:text-neutral-200" strokeWidth={1.75} />
              <span className="text-charcoal-700 text-xs font-medium md:text-sm dark:text-neutral-200">{name}</span>
            </div>
            <div className="rounded-sm border border-blue-500 bg-blue-50 px-2 py-0.5 text-xs text-blue-500">{mark}</div>
          </div>
        ))}
        <div className="mt-2 flex flex-col">
          {[0, 1, 2].map((i) => (
            <MotionDiv
              key={i}
              initial={{ width: `${20 + 20 * Math.random()}%` }}
              animate={{ width: `${70 + 30 * Math.random()}%` }}
              transition={{ duration: 4, delay: 0.2 * i, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
              className="mt-2 h-4 w-full rounded-full bg-gray-200 dark:bg-neutral-800"
            />
          ))}
        </div>
      </MotionDiv>
    </div>
  );
}

const CITATIONS = [
  { title: "study.pdf", subtitle: "page 4", branch: "[1]", variant: "success" },
  { title: "lecture-notes.docx", subtitle: "page 12", branch: "[2]", variant: "success" },
  { title: "Sleep and memory", subtitle: "web page", branch: "[3]", variant: "default" },
  { title: "textbook.pdf", subtitle: "page 88", branch: "[4]", variant: "success" },
  { title: "review-paper.pdf", subtitle: "page 2", branch: "[5]", variant: "warning" },
  { title: "study.pdf", subtitle: "page 9", branch: "[6]", variant: "success" },
  { title: "My notes", subtitle: "pasted", branch: "[7]", variant: "default" },
  { title: "survey.csv", subtitle: "row 140", branch: "[8]", variant: "danger" },
  { title: "textbook.pdf", subtitle: "page 91", branch: "[9]", variant: "success" },
  { title: "Sleep and memory", subtitle: "web page", branch: "[10]", variant: "warning" },
  { title: "lecture-notes.docx", subtitle: "page 3", branch: "[11]", variant: "success" },
  { title: "review-paper.pdf", subtitle: "page 7", branch: "[12]", variant: "default" },
];

const ROW_HEIGHT = 68;
const ROW_STOPS = (n, r) => [
  r - (n - 2) * ROW_HEIGHT,
  r - (n - 1) * ROW_HEIGHT,
  r - n * ROW_HEIGHT,
  r - (n + 1) * ROW_HEIGHT,
  r - (n + 2) * ROW_HEIGHT,
];

function CitationRow({ variant = "default", title, subtitle, branch }) {
  const chip = {
    default: "bg-gray-200",
    danger: "bg-red-200",
    success: "bg-green-200",
    warning: "bg-yellow-200",
  }[variant];
  const mark = {
    default: "text-gray-500",
    danger: "text-red-500",
    success: "text-green-500",
    warning: "text-yellow-500",
  }[variant];
  return (
    <div className="mx-auto flex w-full max-w-sm items-center justify-between rounded-lg p-3">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", chip)}>
          <FileText className={cn("h-4 w-4", mark)} strokeWidth={1.75} />
        </div>
        <span className="text-charcoal-700 text-xs font-medium sm:text-sm">{title}</span>
      </div>
      <div className="ml-2 flex flex-row items-center gap-2">
        <span className="text-charcoal-700 text-xs font-normal">{subtitle}</span>
        <div className="size-1 rounded-full bg-gray-400" />
        <span className="text-charcoal-700 text-xs font-normal">{branch}</span>
      </div>
    </div>
  );
}

function CitationItem({ item, index, offset, center }) {
  const scale = useTransform(offset, ROW_STOPS(index, center), [0.85, 0.95, 1.1, 0.95, 0.85]);
  const stops = [center - (index - 1) * ROW_HEIGHT, center - index * ROW_HEIGHT, center - (index + 1) * ROW_HEIGHT];
  const background = useTransform(offset, stops, ["#FFFFFF", "#f17463", "#FFFFFF"]);
  const borderColor = useTransform(offset, stops, ["#FFFFFF", "#f17463", "#FFFFFF"]);
  return (
    <MotionDiv
      className="mx-auto mt-4 w-full max-w-sm shrink-0 rounded-2xl shadow-xl"
      style={{ scale, background, borderColor }}
    >
      <CitationRow {...item} />
    </MotionDiv>
  );
}

/** Step 3: an endless list of citations; the row at the vertical centre grows and turns coral. */
function CitationsSkeleton() {
  const ref = useRef(null);
  const [height, setHeight] = useState(0);
  const items = useMemo(() => [...CITATIONS, ...CITATIONS, ...CITATIONS], []);
  const center = (height - 64) / 2;
  const offset = useMotionValue(0);
  const loop = ROW_HEIGHT * items.length;

  useEffect(() => {
    const observer = new ResizeObserver((entries) => setHeight(entries[0]?.contentRect.height ?? 0));
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frame;
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      let next = offset.get() - 30 * dt;
      if (Math.abs(next) >= loop / 3) next += loop / 3;
      offset.set(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [offset, loop]);

  return (
    <div
      ref={ref}
      className="relative h-full w-full overflow-hidden"
      style={{
        maskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
      }}
    >
      <MotionDiv className="absolute left-1/2 flex w-full -translate-x-1/2 flex-col items-center" style={{ y: offset }}>
        {items.map((item, index) => (
          <CitationItem key={`${index}-${item.title}`} item={item} index={index} offset={offset} center={center} />
        ))}
      </MotionDiv>
    </div>
  );
}

const TABS = [
  { ...HOW_IT_WORKS.steps[0], id: "sources", icon: MouseBoxIcon, skeleton: <SourcesSkeleton /> },
  { ...HOW_IT_WORKS.steps[1], id: "ask", icon: SecondIcon, skeleton: <AskSkeleton /> },
  { ...HOW_IT_WORKS.steps[2], id: "cite", icon: ThirdIcon, skeleton: <CitationsSkeleton /> },
];

export default function HowItWorks() {
  const [active, setActive] = useState(TABS[0]);

  useEffect(() => {
    const id = setInterval(() => {
      const next = (TABS.findIndex((tab) => tab.id === active.id) + 1) % TABS.length;
      setActive(TABS[next]);
    }, TAB_MS);
    return () => clearInterval(id);
  }, [active]);

  return (
    <section id="how-it-works" className="scroll-mt-24">
      <Container className="border-divide border-x">
        <div className="flex flex-col items-center pt-16">
          <Badge text={HOW_IT_WORKS.eyebrow} />
          <SectionHeading className="mt-4">{HOW_IT_WORKS.title}</SectionHeading>
          <SubHeading as="p" className="mx-auto mt-6 max-w-lg">
            {HOW_IT_WORKS.subtitle}
          </SubHeading>

          {/* Desktop: tab list on the left, animated diagram on the right */}
          <div className="border-divide divide-divide mt-16 hidden w-full grid-cols-2 divide-x border-t lg:grid">
            <div className="divide-divide divide-y">
              {TABS.map((tab) => {
                const isActive = tab.id === active.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActive(tab)}
                    className="group relative flex w-full cursor-pointer flex-col items-start overflow-hidden px-12 py-8 text-left hover:bg-gray-100 dark:hover:bg-neutral-800"
                  >
                    {isActive && (
                      <>
                        <div className="absolute inset-x-0 z-20 h-full w-full bg-white mask-t-from-50% dark:bg-neutral-900" />
                        <PixelatedCanvas
                          isActive
                          fillColor="var(--color-canvas)"
                          backgroundColor="var(--color-canvas-fill)"
                          size={2.5}
                          duration={2500}
                          className="absolute inset-0 scale-[1.01] opacity-20"
                        />
                        <MotionDiv
                          className="bg-brand absolute inset-x-0 bottom-0 z-30 h-0.5 w-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: TAB_MS / 1000 }}
                        />
                      </>
                    )}
                    <div
                      className={cn(
                        "text-charcoal-700 relative z-20 flex items-center gap-2 font-medium dark:text-neutral-100",
                        !isActive && "group-hover:text-brand"
                      )}
                    >
                      <Icon className="shrink-0" /> {tab.title}
                    </div>
                    <p
                      className={cn(
                        "relative z-20 mt-2 text-left text-sm text-gray-600 dark:text-neutral-300",
                        isActive && "text-charcoal-700"
                      )}
                    >
                      {tab.text}
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="relative h-full max-h-[370px] overflow-hidden bg-[radial-gradient(var(--color-dots)_1px,transparent_1px)] mask-r-from-90% mask-l-from-90% mask-radial-from-20% [background-size:10px_10px]">
              <AnimatePresence mode="wait">
                <MotionDiv
                  key={active.id}
                  className="absolute inset-0"
                  initial={{ filter: "blur(10px)", opacity: 0 }}
                  animate={{ filter: "blur(0px)", opacity: 1 }}
                  exit={{ filter: "blur(10px)", opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {active.skeleton}
                </MotionDiv>
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile: every step stacked with its own diagram */}
          <div className="divide-divide border-divide mt-16 flex w-full flex-col divide-y overflow-hidden border-t lg:hidden">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <div key={tab.id} className="group relative flex w-full flex-col items-start overflow-hidden px-4 py-4 md:px-12 md:py-8">
                  <div className="text-charcoal-700 relative z-20 flex items-center gap-2 font-medium dark:text-neutral-100">
                    <Icon className="shrink-0" /> {tab.title}
                  </div>
                  <p className="relative z-20 mt-2 text-left text-sm text-gray-600 dark:text-neutral-300">{tab.text}</p>
                  <div className="relative mx-auto h-80 w-full overflow-hidden mask-t-from-90% mask-r-from-90% mask-b-from-90% mask-l-from-90% sm:h-80 sm:w-160">
                    {tab.skeleton}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
      <DivideX />
    </section>
  );
}
