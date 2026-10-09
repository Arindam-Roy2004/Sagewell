// All landing-page copy lives here so it can be edited without touching layout code.
import {
  FileText,
  FileType2,
  FileSpreadsheet,
  Globe,
  StickyNote,
  BookOpen,
  Newspaper,
  GraduationCap,
  FlaskConical,
  PenLine,
  Presentation,
  Users,
  Library,
  Lock,
  HardDrive,
  Link2,
} from "lucide-react";
import {
  FingerprintIcon,
  RealtimeSyncIcon,
  SdkIcon,
  RocketIcon,
  GraphIcon,
  ReuseBrainIcon,
  ShieldIcon,
  ScreenCogIcon,
} from "./icons";

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
  openSource: "Open source",
};

// Marks that rotate through the "works with" grid (8 are on screen at a time).
export const SOURCE_TYPES = [
  { icon: FileText, label: "PDFs" },
  { icon: FileType2, label: "Word documents" },
  { icon: FileSpreadsheet, label: "CSV files" },
  { icon: Globe, label: "Web pages" },
  { icon: StickyNote, label: "Pasted notes" },
  { icon: BookOpen, label: "Textbooks" },
  { icon: Newspaper, label: "Articles" },
  { icon: GraduationCap, label: "Lecture notes" },
  { icon: FlaskConical, label: "Research papers" },
  { icon: Library, label: "Reading lists" },
];

export const HOW_IT_WORKS = {
  eyebrow: "How it works",
  title: "From reading list to answers",
  subtitle: "Three steps from a pile of documents to answers you can check.",
  steps: [
    { title: "Add your sources", text: "Upload a file, paste notes or add a link." },
    { title: "Ask in plain language", text: "Follow-up questions work too." },
    { title: "Check the citations", text: "Click a citation to open the exact passage." },
  ],
};

export const FEATURES = {
  eyebrow: "Features",
  title: "Built for reading, not guessing",
  subtitle: "Search that finds the right passage, answers that point back to it, and one notebook for everything you read.",
  search: {
    title: "Finds the right passage",
    text: "Searches by meaning and by keyword, then keeps only the best matches.",
  },
  chat: {
    title: "Answers that cite",
    text: "Streams answers and remembers the conversation. Try it below.",
  },
  sources: {
    title: "Every source in one notebook",
    text: "Files, notes and web pages stay linked to where they came from.",
  },
  extras: [
    { icon: FingerprintIcon, title: "Private to you", text: "Documents belong to your account and are kept in private storage." },
    { icon: RealtimeSyncIcon, title: "Streams as it answers", text: "Answers appear as they are written, and follow-up questions keep the context." },
    { icon: SdkIcon, title: "Open source", text: "Read the code, run it yourself and change what you need." },
  ],
};

export const USE_CASES = {
  eyebrow: "Use cases",
  title: "For anyone who reads a lot",
  subtitle: "From a single chapter to a whole semester of material.",
  items: [
    { icon: GraduationCap, title: "Students", text: "Turn notes and chapters into answers to revise from." },
    { icon: FlaskConical, title: "Researchers", text: "Compare papers and jump to the cited section." },
    { icon: PenLine, title: "Writers", text: "Keep your sources together and quote them accurately." },
    { icon: Presentation, title: "Exam prep", text: "Ask for the key points of a lecture and check them against the slides." },
    { icon: Library, title: "Literature reviews", text: "Pull the same question across many papers and see where each answer came from." },
    { icon: Users, title: "Study groups", text: "Share one reading list and settle disagreements with the page number." },
  ],
};

export const BENEFITS = {
  eyebrow: "Benefits",
  title: "Less hunting, more reading",
  subtitle: "Spend your time on what the sources say, not on finding where they say it.",
  items: [
    { icon: RocketIcon, title: "Start in minutes", text: "Drop in a file or paste a link and ask your first question." },
    { icon: RealtimeSyncIcon, title: "Keep the thread", text: "Follow-up questions keep the context of the conversation." },
    { icon: GraphIcon, title: "Ask across sources", text: "Choose which sources to include and ask across all of them at once." },
    { icon: ReuseBrainIcon, title: "Reuse what you learn", text: "Summaries and notes stay in the notebook for the next session." },
    { icon: ShieldIcon, title: "Check before you trust", text: "Every claim links to the passage it came from." },
    { icon: ScreenCogIcon, title: "Summaries on arrival", text: "Each source gets an automatic summary once it has been processed." },
  ],
};

export const PRIVACY = {
  eyebrow: "Private by default",
  title: "Your sources stay yours",
  text: "Documents are private to your account and stored securely. Links you add are checked before they are fetched.",
  cta: "Start a notebook",
  badges: [
    { icon: Lock, label: "Private to you" },
    { icon: HardDrive, label: "Secure storage" },
    { icon: Link2, label: "Safe links" },
  ],
};

export const FAQ = {
  eyebrow: "FAQ",
  title: "Frequently asked questions",
  subtitle: "Everything people ask before adding their first source. Still stuck? Open an issue.",
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
        { label: "Use cases", href: "#use-cases" },
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
