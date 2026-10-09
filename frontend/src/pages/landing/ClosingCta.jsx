import {
  FileText,
  FileType2,
  FileSpreadsheet,
  Globe,
  StickyNote,
  Quote,
  Search,
  BookOpen,
  MessageSquareText,
  GraduationCap,
  FlaskConical,
  PenLine,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Container, DivideX, SectionHeading, Button } from "./primitives";
import { CLOSING } from "./content";

// 13 tiles spread over three rings, counted the same way as the original (outer ring holds the most).
const ICONS = [
  FileText,
  Globe,
  StickyNote,
  Quote,
  Search,
  BookOpen,
  FileType2,
  MessageSquareText,
  FileSpreadsheet,
  GraduationCap,
  FlaskConical,
  PenLine,
  ListChecks,
];

function CtaOrbit({ size = 800, className, numRings = 3, ringDurationsSec }) {
  const total = ICONS.length;
  const rings = Array.from({ length: numRings }, (_, i) => i + 1);
  const weightSum = rings.reduce((a, b) => a + b, 0);
  const perRing = rings.map((weight) => Math.floor((total * weight) / weightSum));
  let remainder = total - perRing.reduce((a, b) => a + b, 0);
  for (let i = numRings - 1; i >= 0 && remainder > 0; i--) {
    perRing[i] += 1;
    remainder--;
  }
  let cursor = 0;
  const iconsByRing = perRing.map((count) => {
    const slice = ICONS.slice(cursor, cursor + count);
    cursor += count;
    return slice;
  });
  const ratios = Array.from({ length: numRings }, (_, i) => 0.42 + (0.52 * i) / (numRings - 1));
  const ringOrder = Array.from({ length: numRings }, (_, i) => numRings - 1 - i);

  return (
    <div className={cn("relative mx-auto flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <div className="pointer-events-none absolute inset-0 z-0">
        {ringOrder.map((ring) => {
          const diameter = Math.round(size * ratios[ring]);
          return (
            <div
              key={`bg-ring-${ring}`}
              className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-inner",
                ring === 0 && "bg-neutral-300 dark:bg-neutral-500",
                ring === 1 && "bg-neutral-200 dark:bg-neutral-600",
                ring === 2 && "bg-neutral-100 dark:bg-neutral-700"
              )}
              style={{ width: diameter, height: diameter }}
            />
          );
        })}
      </div>
      {ringOrder.map((ring) => {
        const ringIcons = iconsByRing[ring];
        const count = ringIcons.length;
        if (count === 0) return null;
        const diameter = Math.round(size * ratios[ring]);
        const radius = diameter / 2;
        const duration = ringDurationsSec?.[ring] ?? 18 + 8 * ring;
        const counter = ring % 2 === 1;
        return (
          <div
            key={`ring-${ring}`}
            className={cn(
              "absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full",
              counter ? "animate-counter-orbit" : "animate-orbit"
            )}
            style={{ width: diameter, height: diameter, "--duration": `${duration}s` }}
          >
            <div className="relative h-full w-full">
              {ringIcons.map((Icon, i) => {
                const angle = (360 / count) * i;
                return (
                  <div
                    key={i}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ transform: `rotate(${angle}deg) translateX(${radius}px)` }}
                  >
                    <div style={{ transform: `rotate(${-angle}deg)` }}>
                      <div
                        className={cn(
                          "shadow-aceternity flex size-14 items-center justify-center rounded-md bg-white dark:bg-neutral-950",
                          counter ? "animate-orbit" : "animate-counter-orbit"
                        )}
                        style={{ "--duration": `${duration}s` }}
                      >
                        <Icon className="size-8 shrink-0 text-neutral-700 dark:text-neutral-200" strokeWidth={1.25} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ClosingCta() {
  return (
    <section>
      <Container className="border-divide relative flex min-h-60 flex-col items-center justify-center overflow-hidden border-x px-4 py-4 md:min-h-120">
        <CtaOrbit className="absolute inset-x-0 -top-120 mask-b-from-30%" />
        <SectionHeading className="relative z-10 text-center lg:text-6xl">
          {CLOSING.titleTop}
          <br /> {CLOSING.titleBottom}
        </SectionHeading>
        <Button to="/auth" className="relative z-20 mt-4">
          {CLOSING.cta}
        </Button>
      </Container>
      <DivideX />
    </section>
  );
}
