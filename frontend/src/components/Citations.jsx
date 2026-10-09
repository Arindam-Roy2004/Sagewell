import { BookOpenText } from 'lucide-react';

/**
 * Renders numbered, clickable citation chips under an assistant message.
 *
 * Chips are numbered [1], [2]… to match the passage numbers the model cites inline.
 * If the answer text references specific passages (e.g. "[1][3]"), we show ONLY those
 * (the passages actually used); otherwise we fall back to showing all retrieved passages.
 * Clicking a chip opens that source in the content panel.
 */
export default function Citations({ citations, content = '', onSelect }) {
  if (!Array.isArray(citations) || citations.length === 0) return null;

  // Which [N] does the answer reference?
  const refs = new Set();
  const re = /\[(\d+)\]/g;
  let m;
  while ((m = re.exec(content)) !== null) refs.add(Number(m[1]));

  const numbered = citations.map((c, i) => ({ ...c, n: i + 1 }));
  const filtered = refs.size > 0 ? numbered.filter((c) => refs.has(c.n)) : numbered;
  const list = filtered.length > 0 ? filtered : numbered;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      {list.slice(0, 6).map((c) => (
        <button
          key={c.n}
          type="button"
          onClick={() => onSelect?.(c)}
          className="inline-flex h-6 items-center gap-1.5 rounded-md border border-border bg-background px-2 text-xs text-foreground shadow-xs transition-colors hover:bg-accent cursor-pointer"
          title={c.snippet ? `"${c.snippet}"` : undefined}
          aria-label={`Open source ${c.originalFileName || 'document'}${c.pageNumber ? `, page ${c.pageNumber}` : ''}`}
        >
          <span className="flex size-4 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground tabular-nums">{c.n}</span>
          <BookOpenText className="size-3 shrink-0 text-muted-foreground" />
          <span className="max-w-[140px] truncate">{c.originalFileName || 'Document'}</span>
          {c.pageNumber && <span className="text-muted-foreground tabular-nums">p.{c.pageNumber}</span>}
        </button>
      ))}
      {list.length > 6 && (
        <span className="text-xs text-muted-foreground">+{list.length - 6} more</span>
      )}
    </div>
  );
}
