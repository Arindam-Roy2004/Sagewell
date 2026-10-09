import { Rails, Rule, SectionHeading, Reveal, SoftCard } from "./primitives";
import { USE_CASES } from "./content";

export default function UseCases() {
  return (
    <section id="use-cases" className="scroll-mt-24">
      <Rails>
        <SectionHeading eyebrow={USE_CASES.eyebrow} title={USE_CASES.title} className="pb-12" />
        <div className="grid gap-8 px-8 pb-20 md:grid-cols-3 lg:gap-10">
          {USE_CASES.items.map((item, i) => (
            <Reveal key={item.title} delay={(i % 3) * 0.06}>
              <SoftCard {...item} />
            </Reveal>
          ))}
        </div>
      </Rails>
      <Rule />
    </section>
  );
}
