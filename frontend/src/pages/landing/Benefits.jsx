import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FileText, Globe } from "lucide-react";
import LeafIcon from "@/components/icons/leaf-icon";
import { Container, DivideX, Badge, SectionHeading, SubHeading, IconBlock } from "./primitives";
import { HorizontalLine, VerticalLine } from "./lines";
import { BellIcon } from "./icons";
import { BENEFITS } from "./content";

const MotionDiv = motion.div;
const MotionSpan = motion.span;

const NOTIFICATIONS = ["Summary ready", "Source indexed", "Citation saved"];
const BARS = [
  { label: "Indexed", width: 85 },
  { label: "Summarised", width: 92 },
  { label: "Cited", width: 65 },
];

function BenefitCard({ icon: Icon, title, text }) {
  return (
    <div className="relative z-10 rounded-lg bg-gray-50 p-4 transition duration-200 hover:bg-transparent md:p-5 dark:bg-neutral-800">
      <div className="flex items-center gap-2">
        <Icon className="text-brand size-6" />
      </div>
      <h3 className="mt-4 mb-2 text-lg font-medium">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{text}</p>
    </div>
  );
}

/** Centre tile: a hub wired to two sources and a dashboard whose notifications cycle. */
function WiredDashboard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % NOTIFICATIONS.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative flex min-h-40 flex-col justify-end overflow-hidden rounded-lg bg-gray-50 p-4 md:p-5 dark:bg-neutral-900">
      <div className="absolute inset-0 bg-[radial-gradient(var(--color-dots)_1px,transparent_1px)] mask-radial-from-10% [background-size:10px_10px] shadow-xl" />
      <div className="flex items-center justify-center">
        <IconBlock icon={<FileText className="size-6 text-neutral-700 dark:text-neutral-200" strokeWidth={1.5} />} />
        <HorizontalLine />
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-200 p-px shadow-xl dark:bg-neutral-700">
          <div className="absolute inset-0 scale-[1.4] animate-spin rounded-full bg-conic [background-image:conic-gradient(at_center,transparent,var(--color-blue-500)_20%,transparent_30%)] [animation-duration:2s]" />
          <div className="via-brand absolute inset-0 scale-[1.4] animate-spin rounded-full bg-conic [background-image:conic-gradient(at_center,transparent,var(--color-brand)_20%,transparent_30%)] [animation-delay:1s] [animation-duration:2s]" />
          <div className="relative z-20 flex h-full w-full items-center justify-center rounded-[5px] bg-white dark:bg-neutral-900">
            <LeafIcon size={26} strokeWidth={2.2} className="text-brand" />
          </div>
        </div>
        <HorizontalLine />
        <IconBlock icon={<Globe className="size-6 text-neutral-700 dark:text-neutral-200" strokeWidth={1.5} />} />
      </div>
      <div className="relative z-20 flex flex-col items-center justify-center">
        <VerticalLine />
        <div className="rounded-sm border border-blue-500 bg-blue-50 px-2 py-0.5 text-xs text-blue-500 dark:bg-blue-900 dark:text-white">
          Connected
        </div>
      </div>
      <div className="h-60 w-full translate-x-10 translate-y-10 overflow-hidden rounded-md bg-gray-200 p-px shadow-xl dark:bg-neutral-700">
        <div className="absolute inset-0 scale-[1.4] animate-spin rounded-full bg-conic from-transparent via-blue-500 via-20% to-transparent to-30% blur-2xl [animation-duration:4s]" />
        <div className="via-brand absolute inset-0 scale-[1.4] animate-spin rounded-full bg-conic from-transparent via-20% to-transparent to-30% blur-2xl [animation-delay:2s] [animation-duration:4s]" />
        <div className="relative z-20 h-full w-full rounded-[5px] bg-white dark:bg-neutral-900">
          <div className="flex items-center justify-between p-4">
            <div className="flex gap-1">
              <div className="size-2 rounded-full bg-red-400" />
              <div className="size-2 rounded-full bg-yellow-400" />
              <div className="size-2 rounded-full bg-green-400" />
            </div>
            <AnimatePresence mode="wait">
              <MotionDiv
                key={index}
                className="shadow-aceternity mr-2 flex items-center gap-1 rounded-sm bg-white px-2 py-1 text-xs text-neutral-500 dark:bg-neutral-700 dark:text-white"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                <BellIcon className="size-3" />
                <MotionSpan>{NOTIFICATIONS[index]}</MotionSpan>
              </MotionDiv>
            </AnimatePresence>
          </div>
          <DivideX />
          <div className="flex h-full flex-row">
            <div className="h-full w-14 bg-gray-200 dark:bg-neutral-800" />
            <MotionDiv className="w-full gap-y-4 p-4">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-neutral-300">Notebook</h2>
              <div className="mt-4 flex flex-col gap-y-3 mask-b-from-50%">
                {BARS.map((bar, i) => (
                  <div key={bar.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{bar.label}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-700">
                      <MotionDiv
                        initial={{ width: 0 }}
                        animate={{ width: `${bar.width}%` }}
                        transition={{ duration: 1.2, delay: 0.4 + 0.1 * i, ease: "easeOut" }}
                        className="h-full rounded-full bg-neutral-300 dark:bg-neutral-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </MotionDiv>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Benefits() {
  const { items } = BENEFITS;
  return (
    <section id="benefits" className="scroll-mt-24">
      <Container className="border-divide relative overflow-hidden border-x px-4 py-20 md:px-8">
        <div className="relative flex flex-col items-center">
          <Badge text={BENEFITS.eyebrow} />
          <SectionHeading className="mt-4">{BENEFITS.title}</SectionHeading>
          <SubHeading as="p" className="mx-auto mt-6 max-w-lg">
            {BENEFITS.subtitle}
          </SubHeading>
        </div>
        <div className="mt-20 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="grid grid-cols-1 gap-4">
            {items.slice(0, 3).map((item) => (
              <BenefitCard key={item.title} {...item} />
            ))}
          </div>
          <WiredDashboard />
          <div className="grid grid-cols-1 gap-4">
            {items.slice(3, 6).map((item) => (
              <BenefitCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </Container>
      <DivideX />
    </section>
  );
}
