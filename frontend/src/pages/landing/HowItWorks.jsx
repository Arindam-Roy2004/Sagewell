import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BookOpen, FileText, Globe, StickyNote, MessageSquareText, Quote, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Rails, Rule, SectionHeading, Chip } from "./primitives";
import { HOW_IT_WORKS } from "./content";

const MotionDiv = motion.div;
const STEP_MS = 6000;

/** A small node card in the diagram (header row + body). */
function NodeCard({ icon: Icon, title, meta, children, className }) {
  return (
    <div className={cn("w-[210px] max-w-full rounded-lg border border-lp-line bg-lp-bg shadow-[0_1px_2px_rgb(0_0_0/0.04)]", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-lp-line px-3 py-2.5 text-[13px]">
        <span className="flex items-center gap-2 text-lp-heading">
          <Icon className="size-3.5" /> {title}
        </span>
        {meta && <span className="font-dm-mono text-[12px] text-lp-text">{meta}</span>}
      </div>
      <div className="px-3 py-3">{children}</div>
    </div>
  );
}

const VISUALS = [
  // Step 1: sources flowing into the notebook (a small tree: notebook, a bus line, three sources)
  () => (
    <div className="flex h-full flex-col items-center justify-center">
      <NodeCard icon={BookOpen} title="Notebook" meta="3 sources" className="w-[200px]">
        <Chip tone="blue">Indexing</Chip>
      </NodeCard>
      <div className="h-6 w-px bg-lp-line" aria-hidden="true" />
      <div className="relative w-full max-w-[560px]">
        {/* Horizontal bus: from the centre of the first column to the centre of the last */}
        <div
          className="absolute top-0 h-px bg-lp-line left-[25%] right-[25%] sm:left-[16.667%] sm:right-[16.667%]"
          aria-hidden="true"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { icon: FileText, title: "PDF", meta: "2.4 MB", chip: <Chip tone="green">Ready</Chip>, extra: "" },
            { icon: Globe, title: "Web page", meta: "", chip: <Chip tone="amber">Reading</Chip>, extra: "hidden sm:flex" },
            { icon: StickyNote, title: "Notes", meta: "", chip: <Chip tone="green">Ready</Chip>, extra: "" },
          ].map(({ icon, title, meta, chip, extra }) => (
            <div key={title} className={cn("flex-col items-center", extra || "flex")}>
              <div className="h-6 w-px bg-lp-line" aria-hidden="true" />
              <NodeCard icon={icon} title={title} meta={meta} className="w-full">
                {chip}
              </NodeCard>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  // Step 2: a question and a streamed answer
  () => (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-sm space-y-3">
        <div className="ml-auto w-fit rounded-lg bg-lp-soft px-3 py-2 text-[13px] text-lp-heading">
          What did the study conclude?
        </div>
        <NodeCard icon={MessageSquareText} title="Answer" meta="streaming" className="w-full">
          <p className="text-[13px] leading-relaxed text-lp-heading">
            The authors found that attention alone was enough to beat recurrent models on translation, while
            training in a fraction of the time<span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-lp-heading align-middle" />
          </p>
        </NodeCard>
        <div className="flex items-center gap-2 rounded-md border border-lp-line bg-lp-bg px-3 py-2 text-[12px] text-lp-text">
          <CornerDownRight className="size-3.5 text-brand" /> Ask a follow-up…
        </div>
      </div>
    </div>
  ),
  // Step 3: citations linked to sources
  () => (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <NodeCard icon={Quote} title="Citation [1]" meta="p. 4" className="w-[260px]">
        <p className="text-[12px] leading-relaxed text-lp-text">
          “…we scale the dot products by 1/√dₖ to counteract this effect.”
        </p>
      </NodeCard>
      <div className="flex gap-3">
        <Chip tone="blue">Open source</Chip>
        <Chip tone="gray">Copy quote</Chip>
      </div>
    </div>
  ),
];

export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const steps = HOW_IT_WORKS.steps;

  useEffect(() => {
    const id = setTimeout(() => setActive((i) => (i + 1) % steps.length), STEP_MS);
    return () => clearTimeout(id);
  }, [active, steps.length]);

  const Visual = VISUALS[active];

  return (
    <section id="how-it-works" className="scroll-mt-24">
      <Rails>
        <SectionHeading eyebrow={HOW_IT_WORKS.eyebrow} title={HOW_IT_WORKS.title} subtitle={HOW_IT_WORKS.subtitle} />
        <div className="grid border-t border-lp-line md:grid-cols-2">
          {/* Step list */}
          <div className="border-lp-line md:border-r">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === active;
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    "relative block w-full border-b border-lp-line px-8 py-8 text-left transition-colors last:border-b-0 md:px-12 cursor-pointer",
                    isActive ? "bg-gradient-to-b from-lp-soft-2 to-transparent" : "hover:bg-lp-soft/60"
                  )}
                >
                  <span className="flex items-center gap-2.5 text-[17px] text-lp-heading">
                    <Icon className="size-4" /> {step.title}
                  </span>
                  <p className={cn("mt-3 max-w-md text-[15px] leading-relaxed", isActive ? "text-lp-heading" : "text-lp-text")}>
                    {step.text}
                  </p>
                  {isActive && (
                    <MotionDiv
                      key={`bar-${active}`}
                      className="absolute bottom-[-1px] left-0 h-[2px] bg-brand"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: STEP_MS / 1000, ease: "linear" }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Visual */}
          <div className="lp-dots relative min-h-[360px] overflow-hidden px-6 py-10">
            <AnimatePresence mode="wait">
              <MotionDiv
                key={active}
                className="h-full"
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.35 }}
              >
                <Visual />
              </MotionDiv>
            </AnimatePresence>
          </div>
        </div>
      </Rails>
      <Rule />
    </section>
  );
}
