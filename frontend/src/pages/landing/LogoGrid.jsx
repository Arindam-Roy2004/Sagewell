import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Container } from "./primitives";
import { SOURCE_TYPES } from "./content";

const MotionDiv = motion.div;

const VISIBLE = 8;

/**
 * 4x2 grid of source marks. Every 3 seconds one random cell swaps to a mark that isn't on
 * screen (slides up out, new one slides in from below). Hovering a cell fills it with brand tint.
 */
export default function LogoGrid() {
  const [shown, setShown] = useState(() => Array.from({ length: VISIBLE }, (_, i) => i));

  useEffect(() => {
    const id = setInterval(() => {
      const hidden = SOURCE_TYPES.map((_, i) => i).filter((i) => !shown.includes(i));
      if (hidden.length === 0) return;
      const cell = Math.floor(Math.random() * shown.length);
      const next = hidden[Math.floor(Math.random() * hidden.length)];
      setShown((current) => {
        const copy = [...current];
        copy[cell] = next;
        return copy;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [shown]);

  return (
    <Container className="border-divide border-x">
      <h2 className="py-8 text-center font-dm-mono text-sm tracking-tight text-neutral-500 uppercase dark:text-gray-300">
        Works with the material you already have
      </h2>
      <div className="border-divide grid grid-cols-2 border-t md:grid-cols-4">
        {shown.map((sourceIndex, i) => {
          const { icon: Icon, label } = SOURCE_TYPES[sourceIndex];
          return (
            <div
              key={i}
              className={cn(
                "border-divide group relative overflow-hidden",
                "border-r md:border-r-0",
                i % 2 === 0 ? "border-r" : "",
                i < 6 ? "border-b md:border-b-0" : "",
                "md:border-r-0",
                i % 4 !== 3 ? "md:border-r" : "",
                i < 4 ? "md:border-b" : ""
              )}
            >
              <div className="bg-brand/5 absolute inset-x-0 bottom-0 h-full translate-y-full transition-all duration-200 group-hover:translate-y-0" />
              <AnimatePresence initial={false} mode="wait">
                <MotionDiv
                  key={sourceIndex}
                  className="group flex min-h-32 items-center justify-center gap-2.5 p-4 py-10 grayscale"
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ opacity: 0, y: -100 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  whileHover={{ opacity: 1 }}
                >
                  <Icon className="size-7 text-neutral-700 transition-all duration-500 dark:text-neutral-200" strokeWidth={1.5} />
                  <span className="text-lg font-medium tracking-tight text-neutral-700 transition-all duration-500 dark:text-neutral-200">
                    {label}
                  </span>
                </MotionDiv>
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Container>
  );
}
