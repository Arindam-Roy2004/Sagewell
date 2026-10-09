import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Rails, Rule, SectionHeading } from "./primitives";
import { FAQ } from "./content";

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-24">
      <Rails>
        <SectionHeading eyebrow={FAQ.eyebrow} title={FAQ.title} className="pb-12" />
        <Accordion type="single" collapsible className="border-t border-lp-line">
          {FAQ.items.map((item) => (
            <AccordionItem key={item.q} value={item.q} className="border-lp-line px-8">
              <AccordionTrigger className="py-6 font-landing text-[16px] font-normal tracking-normal text-lp-heading hover:text-lp-heading [&>span]:border-lp-line [&>span]:bg-lp-bg">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="max-w-3xl pb-6 text-[15px] text-lp-text">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Rails>
      <Rule />
    </section>
  );
}
