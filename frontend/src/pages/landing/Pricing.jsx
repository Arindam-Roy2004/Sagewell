import { CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Rails, Rule, SectionHeading, Reveal, LpButton } from "./primitives";
import { PRICING } from "./content";

export default function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-24">
      <Rails>
        <SectionHeading eyebrow={PRICING.eyebrow} title={PRICING.title} className="pb-14" />
      </Rails>
      <Rule />
      <Rails>
        <div className="grid md:grid-cols-3">
          {PRICING.tiers.map((tier, i) => (
            <Reveal
              key={tier.name}
              delay={i * 0.06}
              className={cn("flex flex-col border-lp-line", i < 2 && "border-b md:border-r md:border-b-0")}
            >
              <div className="border-b border-lp-line px-8 pt-10 pb-8">
                <h3 className="font-landing text-[20px] font-normal tracking-normal text-lp-heading">{tier.name}</h3>
                <p className="mt-1 text-[16px] text-lp-text">{tier.tagline}</p>
                <p className="mt-8 text-lp-heading">
                  <span className="text-[22px]">{tier.price}</span>
                  <span className="ml-2 text-[14px]">{tier.unit}</span>
                </p>
                <LpButton
                  variant={tier.cta.variant}
                  to={tier.cta.to}
                  href={tier.cta.href}
                  className="mt-8 w-full"
                >
                  {tier.cta.label}
                </LpButton>
              </div>
              <ul className="flex-1 space-y-4 px-8 py-10">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-[16px] text-lp-heading">
                    <CircleCheck className="mt-[3px] size-4 shrink-0" strokeWidth={1.75} />
                    {feature}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </Rails>
      <Rule />
    </section>
  );
}
