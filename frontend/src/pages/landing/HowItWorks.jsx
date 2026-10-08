import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BookOpen, FileText, Globe, StickyNote, MessageSquareText, Quote, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Rails, Rule, SectionHeading, Chip } from "./primitives";
import { HOW_IT_WORKS } from "./content";

const MotionDiv = motion.div;
const STEP_MS = 6000;

/** A small node card in the diagram (header row + body). */
function NodeCard({ icon: Icon, title, meta, children, className }) {
  return (
    <div className={cn("w-[210px] rounded-lg border border-lp-line bg-lp-bg shadow-[0_1px_2px_rgb(0_0_0/0.04)]", className)}>
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
  // Step 1: sources flowing into the notebook
  () => (
    <div className="relative flex h-full flex-col items-center justify-center gap-10">
      <NodeCard icon={BookOpen} title="Notebook" meta="3 sources">
        <Chip tone="blue">Indexing</Chip>
      </NodeCard>
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-10 w-px -translate-x-1/2 bg-lp-line" />
      <div className="flex gap-4">
        <NodeCard icon={FileText} title="PDF" meta="2.4 MB" className="w-[150px] sm:w-[180px]">
          <Chip tone="green">Ready</Chip>
        </NodeCard>
        <NodeCard icon={Globe} title="Web page" className="hidden w-[180px] sm:block">
          <Chip tone="amber">Reading</Chip>
        </NodeCard>
        <NodeCard icon={StickyNote} title="Notes" className="w-[150px] sm:w-[180px]">
          <Chip tone="green">Ready</Chip>
        </NodeCard>
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
          <Sparkles className="size-3.5 text-brand" /> Ask a follow-up…
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
