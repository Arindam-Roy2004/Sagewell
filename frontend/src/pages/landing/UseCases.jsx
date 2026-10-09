import { useState } from "react";
import { motion } from "motion/react";
import { Container, DivideX, Badge, SectionHeading, SubHeading, Scale } from "./primitives";
import { USE_CASES } from "./content";

const MotionDiv = motion.div;

/**
 * Six cards. A hatched frame (shared layoutId) slides to whichever card the cursor
 * last entered, and the card itself turns transparent so the hatching shows through.
 */
export default function UseCases() {
  const [hovered, setHovered] = useState(null);

  return (
    <section id="use-cases" className="scroll-mt-24">
      <Container className="border-divide relative overflow-hidden border-x px-4 md:px-8">
        <div className="relative flex flex-col items-center py-20">
          <Badge text={USE_CASES.eyebrow} />
          <SectionHeading className="mt-4">{USE_CASES.title}</SectionHeading>
          <SubHeading as="p" className="mx-auto mt-6 max-w-lg">
            {USE_CASES.subtitle}
          </SubHeading>
          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.items.map(({ icon: Icon, title, text }, index) => (
              <div key={title} onMouseEnter={() => setHovered(index)} className="relative">
                {hovered === index && (
                  <MotionDiv
                    layoutId="scale"
                    className="absolute inset-0 z-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                  >
                    <Scale />
                  </MotionDiv>
                )}
                <div className="relative z-10 rounded-lg bg-gray-50 p-4 transition duration-200 hover:bg-transparent md:p-5 dark:bg-neutral-800">
                  <div className="flex items-center gap-2">
                    <Icon className="text-brand size-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-4 mb-2 text-lg font-medium">{title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
      <DivideX />
    </section>
  );
}
