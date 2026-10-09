// All landing-page copy lives here so it can be edited without touching layout code.
import {
  FileText,
  FileType2,
  Globe,
  StickyNote,
  Upload,
  MessageSquareText,
  Quote,
  Search,
  ListChecks,
  GraduationCap,
  FlaskConical,
  PenLine,
  Lock,
  HardDrive,
  Link2,
} from "lucide-react";

export const REPO_URL = "https://github.com/Arindam-Roy2004/Sagewell";
export const ISSUES_URL = `${REPO_URL}/issues`;

export const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

export const HERO = {
  eyebrow: "For students, researchers and curious minds",
  titleStart: "Ask your documents",
  titleMid: "anything, with ",
  titleAccent: "citations",
  subtitle: "Add PDFs, notes or web pages, then ask questions. Every answer shows where it came from.",
};

// The kinds of sources Sagewell reads.
export const SOURCE_TYPES = [
  { icon: FileText, label: "PDFs" },
  { icon: FileType2, label: "Word documents" },
  { icon: Globe, label: "Web pages" },
  { icon: StickyNote, label: "Notes and text" },
];

export const HOW_IT_WORKS = {
  eyebrow: "How it works",
  title: "From reading list to answers",
  steps: [
    { icon: Upload, title: "Add your sources", text: "Upload a file, paste notes or add a link." },
    { icon: MessageSquareText, title: "Ask in plain language", text: "Follow-up questions work too." },
    { icon: Quote, title: "Check the citations", text: "Click a citation to open the exact passage." },
  ],
};

export const FEATURES = {
  eyebrow: "Features",
  title: "Built for reading, not guessing",
  search: {
    icon: Search,
    title: "Finds the right passage",
    text: "Searches by meaning and by keyword, then keeps only the best matches.",
  },
  chat: {
    icon: MessageSquareText,
    title: "Answers that cite",
    text: "Streams answers and remembers the conversation.",
  },
  sources: {
    icon: ListChecks,
    title: "Every source in one notebook",
    text: "Files, notes and web pages stay linked to where they came from.",
  },
};

export const USE_CASES = {
  eyebrow: "Use cases",
  title: "For anyone who reads a lot",
  items: [
    { icon: GraduationCap, title: "Students", text: "Turn notes and chapters into answers to revise from." },
    { icon: FlaskConical, title: "Researchers", text: "Compare papers and jump to the cited section." },
    { icon: PenLine, title: "Writers", text: "Keep your sources together and quote them accurately." },
  ],
};

export const PRIVACY = {
  title: "Your sources stay yours",
  text: "Documents are private to your account and stored securely.",
  badges: [
    { icon: Lock, label: "Private to you" },
    { icon: HardDrive, label: "Secure storage" },
    { icon: Link2, label: "Safe links" },
  ],
};

export const FAQ = {
  eyebrow: "FAQ",
  title: "Questions",
  items: [
    { q: "What can I add?", a: "PDF, Word, CSV and text files, pasted notes and web pages." },
    { q: "How do citations work?", a: "Each answer is numbered against the passages it used. Click a number to open the source at that spot." },
    { q: "Is my data private?", a: "Yes. Each account only sees its own sources, and files are kept in private storage." },
    { q: "Is there a file size limit?", a: "Files can be up to 50 MB each." },
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
        { label: "FAQ", href: "#faq" },
      ],
    },
    {
      title: "Project",
      links: [
        { label: "GitHub", href: REPO_URL },
        { label: "Report an issue", href: ISSUES_URL },
      ],
    },
    {
      title: "Account",
      links: [{ label: "Sign in or sign up", to: "/auth" }],
    },
  ],
};
