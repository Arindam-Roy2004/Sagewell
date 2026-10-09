import { Database, FileText, Globe, Layers, Paperclip, Send, ArrowUpDown, StickyNote, Boxes, Cpu } from "lucide-react";
import LeafIcon from "@/components/icons/leaf-icon";
import { Rails, Rule, SectionHeading, Reveal, Chip } from "./primitives";
import { FEATURES } from "./content";

function CellTitle({ icon: Icon, title, text }) {
  return (
    <div>
      <h3 className="flex items-center gap-2.5 font-landing text-[18px] font-normal tracking-normal text-lp-heading">
        <Icon className="size-[18px]" /> {title}
      </h3>
      <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-lp-text">{text}</p>
    </div>
  );
}

/** Mock: retrieval channels window. */
function SearchVisual() {
  const rows = [
    { icon: Layers, name: "Meaning search", chip: <Chip tone="green">Active</Chip> },
    { icon: FileText, name: "Keyword search", chip: <Chip tone="green">Active</Chip> },
    { icon: ArrowUpDown, name: "Re-ranking", chip: <Chip tone="amber">Scoring</Chip> },
  ];
  return (
    <div className="relative mx-auto mt-10 h-[290px] max-w-md">
      <div className="absolute top-0 right-0 z-10 w-[170px] rounded-lg border border-lp-line bg-lp-bg shadow-[0_6px_20px_-6px_rgb(0_0_0/0.12)]">
        <div className="flex items-center justify-between border-b border-lp-line px-3 py-2 text-[12px]">
          <span className="text-lp-heading">Top passages</span>
          <span className="font-dm-mono text-lp-text">k=8</span>
        </div>
        <div className="px-3 py-2">
          <Chip tone="blue">Ready</Chip>
        </div>
      </div>
      <div className="absolute top-10 left-0 w-[88%] rounded-xl border border-lp-line bg-lp-bg p-4 shadow-[0_20px_40px_-16px_rgb(0_0_0/0.18)]">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="mt-6 flex items-center gap-2 border-b border-lp-line pb-3 text-[13px] text-lp-heading">
          <Boxes className="size-3.5" /> Search channels
          <span className="rounded bg-lp-soft-2 px-1.5 text-[11px] text-lp-text">3</span>
        </div>
        <ul className="mt-2 space-y-3">
          {rows.map(({ icon: Icon, name, chip }) => (
            <li key={name} className="flex items-center justify-between text-[13px] text-lp-heading">
              <span className="flex items-center gap-2">
                <Icon className="size-3.5 text-brand" /> {name}
              </span>
              {chip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Mock: conversational answer with a composer. */
function ChatVisual() {
  return (
    <div className="relative mx-auto mt-10 flex h-[290px] max-w-md flex-col justify-between">
      <div className="space-y-3">
        <div className="w-fit max-w-[85%] rounded-xl bg-lp-soft px-3.5 py-2.5 text-[13px] text-lp-text opacity-60">
          What does the paper say about training cost?
        </div>
        <div className="ml-auto w-fit max-w-[85%] rounded-xl border border-lp-line bg-lp-bg px-3.5 py-2.5 text-[13px] text-lp-heading">
          And how does that compare to the RNN baseline?
        </div>
        <div className="w-fit max-w-[90%] rounded-xl bg-lp-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-lp-heading">
          It trained in 3.5 days on eight GPUs, a small fraction of the compute the recurrent baselines
          needed <span className="text-brand">[2]</span>.
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-lp-line bg-lp-bg px-3.5 py-3 text-[13px] text-lp-text shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
        Ask Sagewell…
        <Paperclip className="ml-auto size-3.5" />
        <Send className="size-3.5" />
      </div>
    </div>
  );
}

/** Mock: sources → notebook → services diagram. */
function SourcesDiagram() {
  const left = [
    { icon: FileText, label: "PDF and Word files" },
    { icon: Globe, label: "Web pages" },
    { icon: StickyNote, label: "Pasted notes" },
  ];
  const right = [
    { icon: Cpu, label: "Gemini" },
    { icon: Layers, label: "Vector index" },
    { icon: Database, label: "Passages" },
  ];
  return (
    <div className="relative mt-10 grid items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
      <ul className="space-y-5">
        {left.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-3 text-[15px] text-lp-heading">
            <Icon className="size-4" /> {label}
            <span className="hidden h-px flex-1 bg-lp-line md:block" />
          </li>
        ))}
      </ul>
      <div className="mx-auto flex flex-col items-center gap-3">
        <span className="inline-flex size-16 items-center justify-center rounded-xl border border-lp-line bg-lp-bg text-brand shadow-[0_8px_24px_-8px_rgb(0_0_0/0.18)]">
          <LeafIcon size={28} strokeWidth={2.2} />
        </span>
        <Chip tone="blue">Indexed</Chip>
      </div>
      <ul className="space-y-5">
        {right.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-3 text-[15px] text-lp-heading">
            <span className="hidden h-px flex-1 bg-lp-line md:block" />
            <span className="inline-flex size-9 items-center justify-center rounded-lg border border-lp-line bg-lp-bg shadow-[0_1px_2px_rgb(0_0_0/0.05)]">
              <Icon className="size-4" />
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="scroll-mt-24">
      <Rails>
        <SectionHeading eyebrow={FEATURES.eyebrow} title={FEATURES.title} subtitle={FEATURES.subtitle} />

        <div className="grid border-t border-lp-line md:grid-cols-2">
          <Reveal className="overflow-hidden border-b border-lp-line px-8 pt-10 pb-0 md:border-r md:border-b-0">
            <CellTitle {...FEATURES.search} />
            <SearchVisual />
          </Reveal>
          <Reveal delay={0.08} className="overflow-hidden px-8 pt-10 pb-8">
            <CellTitle {...FEATURES.chat} />
            <ChatVisual />
          </Reveal>
        </div>

        <Reveal className="lp-dots border-t border-lp-line px-8 py-12">
          <CellTitle {...FEATURES.sources} />
          <SourcesDiagram />
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {FEATURES.small.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <h3 className="flex items-center gap-2.5 font-landing text-[18px] font-normal tracking-normal text-lp-heading">
                  <Icon className="size-[18px]" /> {title}
                </h3>
                <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-lp-text">{text}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Rails>
      <Rule />
    </section>
  );
}
