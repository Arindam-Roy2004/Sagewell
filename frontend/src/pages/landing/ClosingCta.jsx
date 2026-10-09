import { FileText, Globe, StickyNote, Quote, Search, FileSpreadsheet } from "lucide-react";
import { Rails, Rule, Reveal, LpButton } from "./primitives";
import { CLOSING } from "./content";

// Icon tiles that slowly orbit behind the heading.
const ORBIT = [
  { icon: FileText, radius: 230, delay: "0s" },
  { icon: Globe, radius: 230, delay: "-8s" },
  { icon: StickyNote, radius: 230, delay: "-16s" },
  { icon: Quote, radius: 150, delay: "-4s" },
  { icon: Search, radius: 150, delay: "-12s" },
  { icon: FileSpreadsheet, radius: 150, delay: "-20s" },
];

export default function ClosingCta() {
  return (
    <section>
      <Rails className="relative overflow-hidden">
        {/* Concentric rings */}
        <div aria-hidden="true" className="pointer-events-none absolute top-[-390px] left-1/2 -translate-x-1/2">
          <div className="relative size-[740px] rounded-full bg-lp-soft/70">
            <div className="absolute inset-[100px] rounded-full bg-lp-soft" />
            <div className="absolute inset-[200px] rounded-full bg-lp-soft-2" />
            {/* Icons live in their own layer with a hole cut out around the heading and button. */}
            <div
              className="absolute inset-0 [-webkit-mask-image:radial-gradient(ellipse_360px_170px_at_50%_78%,transparent_72%,#000_100%)] [mask-image:radial-gradient(ellipse_360px_170px_at_50%_78%,transparent_72%,#000_100%)]"
              aria-hidden="true"
            >
              <div className="absolute top-1/2 left-1/2 size-0">
                {ORBIT.map(({ icon: Icon, radius, delay }, i) => (
                  <span
                    key={i}
                    className="absolute -top-6 -left-6 inline-flex size-12 animate-orbit items-center justify-center rounded-lg border border-lp-line bg-lp-bg text-lp-text/60 opacity-70 shadow-[0_1px_3px_rgb(0_0_0/0.06)] motion-reduce:animate-none"
                    style={{ "--orbit-radius": `${radius}px`, animationDelay: delay }}
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col items-center px-6 pt-28 pb-32 text-center md:pt-32 md:pb-36">
          <Reveal>
            <h2 className="font-display text-4xl leading-[1.05] font-normal tracking-tight text-lp-heading sm:text-5xl md:text-6xl">
              {CLOSING.titleTop}
              <br />
              {CLOSING.titleBottom}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <LpButton to="/auth" className="mt-8">
              {CLOSING.cta}
            </LpButton>
          </Reveal>
        </div>
      </Rails>
      <Rule />
    </section>
  );
}
