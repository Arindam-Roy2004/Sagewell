import { useMemo, useRef, useState, useLayoutEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Container, DivideX, Badge, SectionHeading, SubHeading, Button } from "./primitives";
import { FAQ, REPO_URL } from "./content";

const MotionDiv = motion.div;
const MotionSpan = motion.span;
const MotionP = motion.p;

const Chevron = ({ className }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M3.75 6.5L8 10.75L12.25 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function useHeight() {
  const ref = useRef(null);
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.getBoundingClientRect().height));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, height];
}

function FaqItem({ index, question, answer, isOpen, onToggle }) {
  const [contentRef, height] = useHeight();
  const target = useMemo(() => (isOpen ? height : 0), [isOpen, height]);

  return (
    <div className="group">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={`faq-panel-${index}`}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-8 py-6 text-left"
      >
        <span className="text-charcoal-700 text-base font-medium dark:text-neutral-100">{question}</span>
        <MotionSpan
          className="text-charcoal-700 shadow-aceternity inline-flex size-6 items-center justify-center rounded-md bg-white dark:bg-neutral-950"
          initial={false}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <Chevron className="dark:text-neutral-100" />
        </MotionSpan>
      </button>
      <MotionDiv
        id={`faq-panel-${index}`}
        role="region"
        aria-hidden={!isOpen}
        initial={false}
        animate={{ height: target, opacity: isOpen ? 1 : 0 }}
        transition={{ height: { duration: 0.35 }, opacity: { duration: 0.2 } }}
        className="overflow-hidden px-8"
        onClick={onToggle}
      >
        <div ref={contentRef} className="pr-2 pb-5 pl-2 sm:pr-0 sm:pl-0">
          <AnimatePresence mode="popLayout">
            {isOpen && (
              <MotionP
                key="content"
                initial={{ y: -6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -6, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="text-gray-600 dark:text-neutral-400"
              >
                {answer}
              </MotionP>
            )}
          </AnimatePresence>
        </div>
      </MotionDiv>
    </div>
  );
}

export default function Faq() {
  const [open, setOpen] = useState(() => new Set());

  const toggle = (index) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  return (
    <section id="faq" className="scroll-mt-24">
      <Container className="border-divide flex flex-col items-center border-x pt-12">
        <Badge text={FAQ.eyebrow} />
        <SectionHeading className="mt-4">{FAQ.title}</SectionHeading>
        <SubHeading as="p" className="mx-auto mt-6 max-w-lg px-2">
          {FAQ.subtitle}
        </SubHeading>
        <div className="mt-8 mb-12 flex w-full flex-col justify-center gap-4 px-4 sm:flex-row">
          <Button to="/auth" className="w-full sm:w-auto">
            Start a notebook
          </Button>
          <Button variant="secondary" href={`${REPO_URL}/issues`} className="w-full sm:w-auto">
            Ask on GitHub
          </Button>
        </div>
        <DivideX />
        <div className="divide-divide w-full divide-y">
          {FAQ.items.map((item, index) => (
            <FaqItem
              key={item.q}
              index={index}
              question={item.q}
              answer={item.a}
              isOpen={open.has(index)}
              onToggle={() => toggle(index)}
            />
          ))}
        </div>
      </Container>
      <DivideX />
    </section>
  );
}
