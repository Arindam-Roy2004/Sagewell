import { FileText, FileType2, FileSpreadsheet, NotebookText, Globe, File } from "lucide-react";

// Icon, label and tint for each source type.
const META = {
  pdf: { label: "PDF", Icon: FileText, tone: "text-red-500 bg-red-500/10 dark:text-red-400" },
  docx: { label: "Word", Icon: FileType2, tone: "text-blue-600 bg-blue-500/10 dark:text-blue-400" },
  csv: { label: "CSV", Icon: FileSpreadsheet, tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400" },
  text: { label: "Text file", Icon: NotebookText, tone: "text-foreground/70 bg-muted" },
  "text-paste": { label: "Note", Icon: NotebookText, tone: "text-amber-600 bg-amber-500/10 dark:text-amber-400" },
  link: { label: "Web page", Icon: Globe, tone: "text-sky-600 bg-sky-500/10 dark:text-sky-400" },
};

export function getSourceMeta(type) {
  return META[type] || { label: "Source", Icon: File, tone: "text-foreground/70 bg-muted" };
}

export function getSourceName(source) {
  return source?.title || source?.originalFileName || `${getSourceMeta(source?.type).label} source`;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * Confirm-dialog text for deleting a source, spelling out what happens to dialogues.
 * `impact` comes from chatStore.getSourceDeletionImpact().
 */
export function describeSourceDeletion(name, { removed = 0, kept = 0 } = {}) {
  const parts = [`“${name}” and its passages will be permanently deleted.`];
  if (removed) parts.push(`${plural(removed, "dialogue")} that only use${removed === 1 ? "s" : ""} it will be deleted too.`);
  if (kept) parts.push(`${plural(kept, "other dialogue")} will keep their remaining sources.`);
  parts.push("This can't be undone.");
  return parts.join(" ");
}
