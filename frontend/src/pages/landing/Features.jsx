import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  FileText,
  FileType2,
  FileSpreadsheet,
  Globe,
  StickyNote,
  Search,
  User,
} from "lucide-react";
import LeafIcon from "@/components/icons/leaf-icon";
import { cn } from "@/lib/utils";
import { Container, DivideX, Badge, SectionHeading, SubHeading, IconBlock } from "./primitives";
import { HorizontalLine, VerticalLine, ElbowDownLine, StraightLine, ElbowUpLine } from "./lines";
import {
  AttachmentIcon,
  BrainIcon,
  IntegrationsIcon,
  MouseBoxIcon,
  NativeIcon,
  SendIcon,
} from "./icons";
import { FEATURES } from "./content";

const MotionDiv = motion.div;

function CardBody({ children, className }) {
  return <div className={cn("p-4 md:p-8", className)}>{children}</div>;
}

function CardTitle({ children }) {
  return <h3 className="text-charcoal-700 text-lg font-medium dark:text-neutral-100">{children}</h3>;
}

function CardText({ children }) {
  return <p className="mt-2 text-base text-gray-600 dark:text-gray-300">{children}</p>;
}

/** Reveals `text` one character at a time. */
function useTypewriter(text, speed = 100) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayText("");
    setIsComplete(false);
    if (text.length === 0) {
      setIsComplete(true);
      return;
    }
    let index = 0;
    const id = setInterval(() => {
      setDisplayText(text.slice(0, index + 1));
      index += 1;
      if (index === text.length) {
        setIsComplete(true);
        clearInterval(id);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return { displayText, isComplete };
}

const STATUS_TONES = {
  success: "border-emerald-500 bg-emerald-50 text-emerald-500 dark:bg-emerald-50/10",
  warning: "border-yellow-500 bg-yellow-50 text-yellow-500 dark:bg-yellow-50/10",
  danger: "border-red-500 bg-red-50 text-red-500 dark:bg-red-50/10",
};

const MATCHES = [
  { name: "study.pdf", icon: FileText, status: "Best match", variant: "success" },
  { name: "lecture-notes.docx", icon: FileType2, status: "Related", variant: "warning" },
  { name: "old-draft.txt", icon: StickyNote, status: "Skipped", variant: "danger" },
];

/** A burst of small stars that fly out from a row as the scan line passes it. */
function Sparkles({ row }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: 8 }, () => ({
        x: 100 * Math.random() - 50,
        y: 100 * Math.random() - 50,
        delay: 0.8 * Math.random(),
        duration: 0.5 + Math.random(),
        peak: 0.5 + 0.5 * Math.random(),
      })),
    []
  );
  return sparks.map((spark, i) => (
    <MotionDiv
      key={i}
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      whileInView={{ opacity: [0, 1, 0], scale: [0, spark.peak, 0], x: spark.x, y: spark.y, rotate: [0, 360] }}
      viewport={{ once: true }}
      transition={{ duration: spark.duration, delay: row + spark.delay, ease: "easeOut" }}
      className="absolute top-1/2 left-1/2 h-1 w-1 text-xs text-blue-400"
    >
      ✨
    </MotionDiv>
  ));
}

/** Card 1: passages being scanned and ranked. */
function PassageSearch() {
  return (
    <MotionDiv className="relative mx-auto mt-20 h-full max-h-70 min-h-40 w-[85%] rounded-2xl border-t border-gray-300 bg-white p-4 shadow-2xl dark:border-neutral-700 dark:bg-neutral-800">
      <MotionDiv
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 1.5 }}
        className="shadow-aceternity absolute -top-10 -right-10 z-20 flex w-40 shrink-0 flex-col items-start rounded-lg bg-white text-xs dark:bg-neutral-900"
      >
        <div className="flex w-full items-center justify-between p-2">
          <div className="flex items-center gap-2 font-medium">
            <Search className="size-4 shrink-0" strokeWidth={1.75} />
            Search
          </div>
          <p className="font-mono text-gray-600">hybrid</p>
        </div>
        <DivideX />
        <div className="m-2 rounded-sm border border-blue-500 bg-blue-50 px-2 py-0.5 text-blue-500 dark:bg-blue-50/10">Ranked</div>
      </MotionDiv>
      <div className="mb-4 flex gap-2">
        <div className="h-3 w-3 rounded-full bg-red-500" />
        <div className="h-3 w-3 rounded-full bg-yellow-500" />
        <div className="h-3 w-3 rounded-full bg-green-500" />
      </div>
      <div className="mt-12 flex items-center gap-2">
        <IntegrationsIcon />
        <span className="text-charcoal-700 text-sm font-medium dark:text-neutral-200">All passages</span>
        <span className="text-charcoal-700 rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200">
          1,284
        </span>
      </div>
      <DivideX className="mt-2" />
      {MATCHES.map(({ name, icon: Icon, status, variant }, row) => (
        <div key={name} className="relative">
          <MotionDiv
            className="mt-4 flex items-center justify-between gap-2"
            initial={{ clipPath: "inset(0 100% 0 0)", filter: "blur(10px)" }}
            whileInView={{ clipPath: "inset(0 0% 0 0)", filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: row, ease: "easeInOut" }}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span className="text-charcoal-700 text-sm font-medium dark:text-neutral-200">{name}</span>
            </div>
            <div className={cn("rounded-sm border px-2 py-0.5 text-xs", STATUS_TONES[variant])}>{status}</div>
          </MotionDiv>
          <MotionDiv
            initial={{ left: 0, opacity: 0 }}
            whileInView={{ left: "100%", opacity: [0, 1, 1, 1, 0] }}
            viewport={{ once: true }}
            transition={{
              left: { duration: 1, delay: row, ease: "easeInOut" },
              opacity: { duration: 1, delay: row, ease: "easeInOut" },
            }}
            className="absolute inset-y-0 left-0 h-full w-[2px] bg-gradient-to-t from-transparent via-blue-500 to-transparent"
          >
            <Sparkles row={row} />
          </MotionDiv>
        </div>
      ))}
    </MotionDiv>
  );
}

const SEED_MESSAGES = [
  { role: "user", content: "What did the study conclude about sleep?" },
  { role: "assistant", content: "Eight hours of sleep improved recall by about 20% [1]." },
  { role: "user", content: "Which page is that on?" },
  { role: "assistant", content: "Page 4 of study.pdf. Click [1] to open it." },
];

const DEMO_REPLIES = [
  "This is a demo. Create a notebook to ask your own sources.",
  "In the app, every answer is numbered against the passages it used.",
  "Add a PDF, notes or a web page and ask away.",
];

function ChatBubble({ role, content, isActive, onComplete }) {
  const { displayText, isComplete } = useTypewriter(content, 30);

  useEffect(() => {
    if (isComplete && isActive) onComplete();
  }, [isComplete, isActive, onComplete]);

  const text = isActive ? displayText : content;
  const caret = isActive && !isComplete && <span className="animate-pulse">|</span>;

  if (role === "user") {
    return (
      <div className="flex justify-end gap-3">
        <div className="flex max-w-xs flex-col gap-1">
          <div className="rounded-2xl rounded-br-md bg-blue-500 px-4 py-2 text-sm text-white">
            {text}
            {caret}
          </div>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <User className="size-4" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 px-1">
      <div className="shadow-aceternity flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-neutral-900">
        <LeafIcon size={16} strokeWidth={2.4} className="text-brand" />
      </div>
      <div className="flex max-w-xs flex-col gap-1">
        <div className="text-charcoal-700 rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2 text-sm dark:bg-neutral-700 dark:text-neutral-100">
          {text}
          {caret}
        </div>
      </div>
    </div>
  );
}

/** Card 2: a chat that types itself out, and answers if you type into it. */
function CitedChat() {
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [visible, setVisible] = useState(0);
  const [advance, setAdvance] = useState(false);
  const [scroller, setScroller] = useState(null);
  const replyCount = useRef(0);

  const send = () => {
    if (!input.trim()) return;
    const reply = DEMO_REPLIES[replyCount.current++ % DEMO_REPLIES.length];
    const next = [...messages, { role: "user", content: input.trim() }, { role: "assistant", content: reply }];
    setMessages(next);
    setVisible(next.length);
    setInput("");
    setAdvance(false);
  };

  useEffect(() => {
    const id = setTimeout(() => setVisible(1), 200);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (advance && visible < messages.length) {
      const id = setTimeout(() => {
        setVisible((v) => v + 1);
        setAdvance(false);
      }, 400);
      return () => clearTimeout(id);
    }
  }, [advance, visible, messages.length]);

  useEffect(() => {
    scroller?.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
  }, [visible, scroller]);

  return (
    <MotionDiv className="relative mx-auto mt-2 h-full max-h-70 min-h-40 w-[85%] p-4">
      <div className="absolute inset-x-0 -bottom-4 mx-auto flex w-[85%] items-center justify-between rounded-lg border border-gray-300 bg-white shadow-[0px_2px_12px_0px_rgba(0,0,0,0.08)] dark:border-neutral-700 dark:bg-neutral-800">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && send()}
          className="flex-1 border-none bg-transparent px-4 py-4 text-xs placeholder-neutral-600 focus:outline-none dark:text-neutral-100"
          placeholder="Ask Sagewell"
          aria-label="Try the demo chat"
        />
        <div className="mr-4 flex items-center gap-2 text-gray-600 dark:text-neutral-300">
          <AttachmentIcon />
          <button type="button" onClick={send} className="cursor-pointer" aria-label="Send">
            <SendIcon />
          </button>
        </div>
      </div>
      <div
        ref={setScroller}
        className="mask-bg-gradient-to-b flex max-h-[calc(100%-1rem)] flex-col gap-4 overflow-y-auto from-white to-transparent mask-t-from-70% mask-b-from-70% pt-4 pb-16 dark:from-neutral-900 dark:to-transparent"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {messages.slice(0, visible).map((message, i) => (
          <MotionDiv
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
          >
            <ChatBubble
              role={message.role}
              content={message.content}
              isActive={i === visible - 1}
              onComplete={() => setAdvance(true)}
            />
          </MotionDiv>
        ))}
      </div>
    </MotionDiv>
  );
}

function SourceLabel({ icon: Icon, text, children }) {
  return (
    <div className="relative flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-neutral-700 dark:text-neutral-200" strokeWidth={1.75} />
      <span className="text-charcoal-700 text-sm font-medium dark:text-neutral-200">{text}</span>
      {children}
    </div>
  );
}

/** Spinning-border tile in the middle of the diagram. */
function Hub() {
  return (
    <div className="relative h-16 w-16 overflow-hidden rounded-md bg-gray-200 p-px shadow-xl dark:bg-neutral-700">
      <div className="absolute inset-0 scale-[1.4] animate-spin rounded-full bg-conic [background-image:conic-gradient(at_center,transparent,var(--color-blue-500)_20%,transparent_30%)] [animation-duration:2s]" />
      <div className="absolute inset-0 scale-[1.4] animate-spin rounded-full [background-image:conic-gradient(at_center,transparent,var(--color-brand)_20%,transparent_30%)] [animation-delay:1s] [animation-duration:2s]" />
      <div className="relative z-20 flex h-full w-full items-center justify-center rounded-[5px] bg-white dark:bg-neutral-900">
        <LeafIcon size={26} strokeWidth={2.2} className="text-brand" />
      </div>
    </div>
  );
}

const tile = "size-6 text-neutral-700 dark:text-neutral-200";

/** Wide card: your files fan in to one notebook, then fan out as searchable sources. */
function SourceFlow() {
  return (
    <>
      {/* Small screens: a compact vertical version */}
      <div className="relative mx-auto my-12 flex flex-col items-center lg:hidden">
        <div className="flex gap-3">
          {[FileText, FileType2, FileSpreadsheet, Globe].map((Icon, i) => (
            <IconBlock key={i} icon={<Icon className={tile} strokeWidth={1.5} />} />
          ))}
        </div>
        <VerticalLine />
        <Hub />
        <VerticalLine />
        <span className="rounded-sm border border-blue-500 bg-blue-50 px-2 py-0.5 text-xs text-blue-500 dark:bg-blue-900 dark:text-white">
          Connected
        </span>
      </div>

      <MotionDiv className="relative mx-auto my-12 hidden h-full max-h-70 min-h-80 max-w-[67rem] grid-cols-2 p-4 lg:grid">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-10">
            <SourceLabel icon={FileText} text="Research papers">
              <ElbowDownLine className="absolute top-2 -right-84" />
            </SourceLabel>
            <SourceLabel icon={StickyNote} text="Lecture notes">
              <StraightLine className="absolute top-2 -right-84" />
            </SourceLabel>
            <SourceLabel icon={Globe} text="Web articles">
              <ElbowUpLine className="absolute -right-84 bottom-2" />
            </SourceLabel>
          </div>
          <Hub />
        </div>
        <div className="relative flex h-full w-full items-center justify-start">
          <HorizontalLine />
          <div className="relative flex flex-col items-center gap-2">
            <span className="relative z-20 rounded-sm border border-blue-500 bg-blue-50 px-2 py-0.5 text-xs text-blue-500 dark:bg-blue-900 dark:text-white">
              Connected
            </span>
            <div className="absolute inset-x-0 -top-30 flex h-full flex-col items-center">
              <IconBlock icon={<FileText className={tile} strokeWidth={1.5} />} />
              <VerticalLine />
              <VerticalLine />
              <IconBlock icon={<FileType2 className={tile} strokeWidth={1.5} />} />
            </div>
          </div>
          <div className="absolute -top-4 right-30 flex h-full flex-col items-center">
            <IconBlock icon={<FileSpreadsheet className={tile} strokeWidth={1.5} />} />
            <VerticalLine />
            <IconBlock icon={<StickyNote className={tile} strokeWidth={1.5} />} />
          </div>
          <HorizontalLine />
          <IconBlock icon={<Globe className={tile} strokeWidth={1.5} />} />
        </div>
      </MotionDiv>
    </>
  );
}

export default function Features() {
  return (
    <section id="features" className="scroll-mt-24">
      <Container className="border-divide border-x">
        <div className="flex flex-col items-center py-16">
          <Badge text={FEATURES.eyebrow} />
          <SectionHeading className="mt-4">{FEATURES.title}</SectionHeading>
          <SubHeading as="p" className="mx-auto mt-6 max-w-lg px-2">
            {FEATURES.subtitle}
          </SubHeading>

          <div className="border-divide divide-divide mt-16 grid w-full grid-cols-1 divide-y border-y md:grid-cols-2 md:divide-x">
            <CardBody className="overflow-hidden mask-b-from-80%">
              <div className="flex items-center gap-2">
                <BrainIcon />
                <CardTitle>{FEATURES.search.title}</CardTitle>
              </div>
              <CardText>{FEATURES.search.text}</CardText>
              <PassageSearch />
            </CardBody>
            <CardBody className="overflow-hidden mask-b-from-80%">
              <div className="flex items-center gap-2">
                <MouseBoxIcon />
                <CardTitle>{FEATURES.chat.title}</CardTitle>
              </div>
              <CardText>{FEATURES.chat.text}</CardText>
              <CitedChat />
            </CardBody>
          </div>

          <div className="w-full">
            <CardBody className="relative w-full max-w-none overflow-hidden">
              <div className="pointer-events-none absolute inset-0 h-full w-full bg-[radial-gradient(var(--color-dots)_1px,transparent_1px)] mask-radial-from-10% [background-size:10px_10px]" />
              <div className="flex items-center gap-2">
                <NativeIcon />
                <CardTitle>{FEATURES.sources.title}</CardTitle>
              </div>
              <CardText>{FEATURES.sources.text}</CardText>
              <SourceFlow />
            </CardBody>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {FEATURES.extras.map(({ icon: Icon, title, text }) => (
              <CardBody key={title}>
                <div className="flex items-center gap-2">
                  <Icon />
                  <CardTitle>{title}</CardTitle>
                </div>
                <CardText>{text}</CardText>
              </CardBody>
            ))}
          </div>
        </div>
      </Container>
      <DivideX />
    </section>
  );
}
