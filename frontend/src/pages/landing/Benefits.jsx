import { Bell, FileText, Globe } from "lucide-react";
import LeafIcon from "@/components/icons/leaf-icon";
import { Rails, Rule, SectionHeading, Reveal, Chip, SoftCard } from "./primitives";
import { BENEFITS } from "./content";

/** Centre visual: a source connected to the notebook, plus a mini library panel. */
function CenterVisual() {
  const bars = [
    { label: "Passages indexed", width: "w-[78%]" },
    { label: "Summaries written", width: "w-[92%]" },
    { label: "Citations checked", width: "w-[55%]" },
  ];
  return (
    <div className="lp-dots relative h-full min-h-[420px] overflow-hidden rounded-lg bg-lp-soft">
      <div className="absolute top-[100px] right-10 left-10 h-px bg-lp-line" />
      <span className="absolute top-[78px] left-6 inline-flex size-11 items-center justify-center rounded-lg border border-lp-line bg-lp-bg shadow-[0_1px_3px_rgb(0_0_0/0.08)]">
        <FileText className="size-5 text-lp-heading" />
      </span>
      <span className="absolute top-[70px] left-1/2 inline-flex size-[60px] -translate-x-1/2 items-center justify-center rounded-xl border border-lp-line bg-lp-bg text-brand shadow-[0_8px_24px_-8px_rgb(0_0_0/0.2)]">
        <LeafIcon size={26} strokeWidth={2.2} />
      </span>
      <span className="absolute top-[78px] right-6 inline-flex size-11 items-center justify-center rounded-lg border border-lp-line bg-lp-bg shadow-[0_1px_3px_rgb(0_0_0/0.08)]">
        <Globe className="size-5 text-lp-heading" />
      </span>
      <div className="absolute top-[132px] left-1/2 h-[90px] w-px -translate-x-1/2 bg-lp-line" />
      <div className="absolute top-[220px] left-1/2 -translate-x-1/2">
        <Chip tone="blue">Connected</Chip>
      </div>

      <div className="absolute right-0 bottom-0 left-[12%] rounded-tl-lg border-t border-l border-lp-line bg-lp-bg shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.15)]">
        <div className="flex items-center justify-between border-b border-lp-line px-4 py-2.5">
          <span className="flex gap-1.5">
            <span className="size-2 rounded-full bg-red-400" />
            <span className="size-2 rounded-full bg-amber-400" />
            <span className="size-2 rounded-full bg-emerald-400" />
          </span>
          <span className="flex items-center gap-1 rounded border border-lp-line px-2 py-0.5 text-[11px] text-lp-text">
            <Bell className="size-3" /> Dialogue saved
          </span>
        </div>
        <div className="px-5 py-4">
          <p className="text-[14px] font-medium text-lp-heading">Library</p>
          <div className="mt-3 space-y-3">
            {bars.map(({ label, width }) => (
              <div key={label}>
                <p className="text-[11px] text-lp-text">{label}</p>
                <div className="mt-1 h-1.5 w-full rounded-full bg-lp-soft-2">
                  <div className={`h-1.5 rounded-full bg-lp-line ${width}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Benefits() {
  return (
    <section id="benefits" className="scroll-mt-24">
      <Rails>
        <SectionHeading eyebrow={BENEFITS.eyebrow} title={BENEFITS.title} subtitle={BENEFITS.subtitle} className="pb-12" />
        <div className="grid gap-4 px-8 pb-20 lg:grid-cols-3">
          <div className="space-y-4">
            {BENEFITS.left.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.06}>
                <SoftCard {...item} />
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1} className="hidden lg:block">
            <CenterVisual />
          </Reveal>
          <div className="space-y-4">
            {BENEFITS.right.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.06}>
                <SoftCard {...item} />
              </Reveal>
            ))}
          </div>
        </div>
      </Rails>
      <Rule />
    </section>
  );
}
