// All landing-page copy lives here so it can be edited without touching layout code.
import {
  FileText,
  FileType,
  FileSpreadsheet,
  FileCode2,
  Globe,
  StickyNote,
  MonitorPlay,
  BookOpen,
  Upload,
  MessageSquareText,
  Quote,
  Search,
  ListChecks,
  Brain,
  KeyRound,
  History,
  Github,
  GraduationCap,
  FlaskConical,
  Code2,
  Scale,
  Lightbulb,
  PenLine,
  Rocket,
  RefreshCw,
  BarChart3,
  Recycle,
  ShieldCheck,
  ScrollText,
  Lock,
  HardDrive,
  Link2,
} from "lucide-react";

export const REPO_URL = "https://github.com/Arindam-Roy2004/Sagewell";
export const README_URL = `${REPO_URL}#readme`;
export const ISSUES_URL = `${REPO_URL}/issues`;

export const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export const HERO = {
  eyebrow: "For students, researchers and curious minds.",
  titleStart: "Ask your documents",
  titleMid: "anything, with ",
  titleAccent: "citations",
  subtitle:
    "Add PDFs, notes and web pages, then ask questions in plain language. Every answer points back to the passage it came from.",
  footnote: "Open source · Gemini, Qdrant and LangChain under the hood",
};

// "Logo" strip: the kinds of sources Sagewell reads.
export const SOURCE_TYPES = [
  { icon: FileText, label: "PDF documents" },
  { icon: FileType, label: "Word files" },
  { icon: FileSpreadsheet, label: "CSV tables" },
  { icon: FileCode2, label: "Plain text" },
  { icon: Globe, label: "Web articles" },
  { icon: StickyNote, label: "Pasted notes" },
  { icon: MonitorPlay, label: "JavaScript sites" },
  { icon: BookOpen, label: "Wikipedia pages" },
];

export const HOW_IT_WORKS = {
  eyebrow: "How it works",
  title: "From reading list to answers",
  subtitle: "Three calm steps. No setup, no prompts to learn.",
  steps: [
    {
      icon: Upload,
      title: "Add your sources",
      text: "Upload a PDF or Word file, paste notes, or add a link. Sagewell reads it and writes a short summary.",
    },
    {
      icon: MessageSquareText,
      title: "Ask in plain language",
      text: "Ask follow-up questions the way you would ask a friend. Sagewell remembers the conversation.",
    },
    {
      icon: Quote,
      title: "Check the citations",
      text: "Each answer is numbered against the passages it used. Click a citation to open the exact source.",
    },
  ],
};

export const FEATURES = {
  eyebrow: "Features",
  title: "Built for reading, not guessing",
  subtitle: "Retrieval that finds the right passage first, then an answer that stays inside your sources.",
  search: {
    icon: Search,
    title: "Hybrid search",
    text: "Keyword and meaning-based search run together, then a re-ranking step keeps only the strongest passages.",
  },
  chat: {
    icon: MessageSquareText,
    title: "Conversational answers",
    text: "Answers stream in as they are written, with follow-ups that understand what “it” and “that” refer to.",
  },
  sources: {
    icon: ListChecks,
    title: "Every source in one notebook",
    text: "Files, notes and web pages are split into passages, indexed for search, and stay linked to their origin.",
  },
  small: [
    { icon: KeyRound, title: "Google sign-in", text: "Sign in with one click, or use an email and password if you prefer." },
    { icon: History, title: "Conversation memory", text: "Long chats are summarized in the background so earlier context isn’t lost." },
    { icon: Github, title: "Open source", text: "Read the code, run it on your own machine, or suggest an improvement." },
  ],
};

export const USE_CASES = {
  eyebrow: "Use cases",
  title: "For anyone who reads a lot",
  subtitle: "If your work starts with a pile of documents, Sagewell helps you get to the point.",
  items: [
    { icon: GraduationCap, title: "Students", text: "Turn lecture notes and textbook chapters into answers you can revise from." },
    { icon: FlaskConical, title: "Researchers", text: "Compare findings across papers and jump straight to the cited section." },
    { icon: Code2, title: "Engineers", text: "Ask questions of long technical docs, specs and READMEs without skimming." },
    { icon: Scale, title: "Policy readers", text: "Find the clause that answers your question in long policies and terms." },
    { icon: Lightbulb, title: "Product teams", text: "Pull insights from interview notes and research reports in minutes." },
    { icon: PenLine, title: "Writers", text: "Keep your sources in one place and quote them accurately." },
  ],
};

export const BENEFITS = {
  eyebrow: "Benefits",
  title: "Understand more in less time",
  subtitle: "Spend your attention on thinking, not on searching through pages.",
  left: [
    { icon: Rocket, title: "Get to the point", text: "Skip the skim. Ask the question you actually have." },
    { icon: RefreshCw, title: "Follow your curiosity", text: "Ask a follow-up and keep the thread going." },
    { icon: BarChart3, title: "Compare sources", text: "Select several documents and ask across all of them." },
  ],
  right: [
    { icon: Recycle, title: "Reuse what you read", text: "Your library stays ready for the next question." },
    { icon: ShieldCheck, title: "Trust the answer", text: "Citations show exactly where each claim came from." },
    { icon: ScrollText, title: "Instant summaries", text: "Every new source gets a title and a short summary." },
  ],
};

export const OPEN_SOURCE = {
  label: "Built in the open",
  statement:
    "Sagewell is open source. Every part of it, from the search pipeline to this page, is on GitHub for you to read, run and improve.",
  author: "Sagewell on GitHub",
  authorNote: "Issues and pull requests are welcome",
  stat: "100%",
  statLabel: "Open source",
  stack: ["React", "Express", "MongoDB", "Qdrant", "Redis", "Gemini", "LangChain", "Context.dev"],
};

export const PRICING = {
  eyebrow: "Pricing",
  title: "Simple, honest pricing",
  tiers: [
    {
      name: "Explore",
      tagline: "Hosted, during the beta",
      price: "$0",
      unit: "/beta",
      cta: { label: "Get started", to: "/auth", variant: "outline" },
      features: [
        "Your own private notebooks",
        "PDF, Word, CSV, text and web sources",
        "Answers with clickable citations",
        "Google sign-in",
        "Conversation memory",
      ],
    },
    {
      name: "Self-host",
      tagline: "Run it on your own servers",
      price: "$0",
      unit: "/open source",
      highlighted: true,
      cta: { label: "View on GitHub", href: REPO_URL, variant: "brand" },
      features: [
        "Everything in Explore",
        "Your own Gemini, database and storage keys",
        "Files stay in your own storage bucket",
        "Docker files included",
        "Change anything you like",
      ],
    },
    {
      name: "Contribute",
      tagline: "Help shape what comes next",
      price: "Free",
      unit: "/always",
      cta: { label: "Open an issue", href: ISSUES_URL, variant: "outline" },
      features: [
        "Report bugs and request features",
        "Send pull requests",
        "Discuss ideas in GitHub issues",
        "Credit in the project history",
      ],
    },
  ],
};

export const PRIVACY = {
  label: "For privacy-minded readers",
  title: "Your sources stay yours",
  text: "Each account’s documents are kept apart from everyone else’s, files live in a private storage bucket, and links are checked before they are fetched.",
  cta: "Read how it works",
  badges: [
    { icon: Lock, label: "Per-user isolation" },
    { icon: HardDrive, label: "Private storage" },
    { icon: Link2, label: "Safe link fetching" },
  ],
};

export const FAQ = {
  eyebrow: "FAQs",
  title: "Frequently asked questions",
  subtitle: "Everything you might want to know before you start. Still have a question? Ask on GitHub.",
  items: [
    {
      q: "What can I add to a notebook?",
      a: "PDF, Word (DOCX), CSV and plain-text files, pasted notes, and web pages. Pages that need JavaScript to load are read through a rendering service.",
    },
    {
      q: "How do the citations work?",
      a: "Sagewell finds the passages that best match your question, writes an answer from them, and numbers each passage. Click a number to open the source at that spot.",
    },
    {
      q: "Where is my data stored?",
      a: "Your account details and passages are stored in the app’s database, search vectors in a private vector index, and uploaded files in a private storage bucket. Each account only sees its own sources.",
    },
    {
      q: "Which AI model answers my questions?",
      a: "Answers, summaries and search embeddings use Google’s Gemini models. The self-hosted version lets you choose the exact models.",
    },
    {
      q: "Can I run Sagewell myself?",
      a: "Yes. The full source code is on GitHub, with instructions for running the API, the background worker and the web app.",
    },
    {
      q: "Is there a limit on file size?",
      a: "Uploads can be up to 50 MB each. Very large web pages may take a little longer to process.",
    },
  ],
};

export const CLOSING = {
  titleTop: "Bring your reading list.",
  titleBottom: "Leave with answers.",
  cta: "Start a notebook",
};

export const FOOTER = {
  tagline: "Chat with your sources, with citations.",
  columns: [
    {
      title: "Product",
      links: [
        { label: "How it works", href: "#how-it-works" },
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "FAQ", href: "#faq" },
      ],
    },
    {
      title: "Project",
      links: [
        { label: "GitHub", href: REPO_URL },
        { label: "Documentation", href: README_URL },
        { label: "Report an issue", href: ISSUES_URL },
      ],
    },
    {
      title: "Account",
      links: [
        { label: "Sign in", to: "/auth" },
        { label: "Get started", to: "/auth" },
      ],
    },
  ],
};
