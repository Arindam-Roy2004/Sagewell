import { Rails, Rule, Reveal } from "./primitives";
import { PRIVACY } from "./content";

export default function Privacy() {
  return (
    <section id="privacy">
      <Rails className="bg-lp-soft">
        <div className="grid items-center gap-12 px-8 py-16 md:grid-cols-2 md:py-16">
          <Reveal>
            <h2 className="font-display text-3xl font-normal tracking-tight text-lp-heading md:text-[40px] md:leading-tight">
              {PRIVACY.title}
            </h2>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-lp-text">{PRIVACY.text}</p>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-wrap items-center justify-center gap-10 md:justify-end md:pr-12">
            {PRIVACY.badges.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-3">
                <span className="inline-flex size-16 items-center justify-center rounded-full border-2 border-lp-text/50 text-lp-text">
                  <Icon className="size-7" strokeWidth={1.5} />
                </span>
                <span className="flex items-center gap-1.5 text-[13px] text-lp-text">
                  <span className="size-2 rounded-full bg-lp-text/70" /> {label}
                </span>
              </div>
            ))}
          </Reveal>
        </div>
      </Rails>
      <Rule />
    </section>
  );
}
