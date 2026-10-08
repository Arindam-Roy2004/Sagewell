import {
  LayoutGrid,
  Library,
  MessagesSquare,
  Quote,
  Settings,
  Search,
  HelpCircle,
  PanelLeft,
  FileText,
  Globe,
  StickyNote,
  Layers,
  MessageSquareText,
  Sparkles,
  Clock,
  Send,
} from "lucide-react";
import LeafIcon from "@/components/icons/leaf-icon";
import { Chip } from "./primitives";

const NAV = [
  { icon: LayoutGrid, label: "Overview", active: true },
  { icon: Library, label: "Sources" },
  { icon: MessagesSquare, label: "Dialogues" },
  { icon: Quote, label: "Citations" },
  { icon: Settings, label: "Settings" },
];

const STATS = [
  { icon: Layers, tone: "text-blue-500 bg-blue-500/10", value: "12", label: "Sources in notebook" },
  { icon: MessageSquareText, tone: "text-brand bg-brand/10", value: "48", label: "Questions asked" },
  { icon: Clock, tone: "text-emerald-500 bg-emerald-500/10", value: "3", label: "Open dialogues" },
  { icon: Sparkles, tone: "text-amber-500 bg-amber-500/10", value: "Gemini", label: "Answer model" },
];

const ROWS = [
  { icon: FileText, name: "attention-is-all-you-need.pdf", type: "PDF", tone: "red", status: "Ready", dot: "bg-emerald-500", passages: "142", added: "2 min ago" },
  { icon: Globe, name: "Retrieval-augmented generation", type: "Web", tone: "blue", status: "Processing", dot: "bg-amber-400", passages: "—", added: "Just now" },
  { icon: StickyNote, name: "Lecture notes, week 4", type: "Note", tone: "green", status: "Ready", dot: "bg-emerald-500", passages: "18", added: "1 hr ago" },
];

/** Static, illustrative mock of the Sagewell workspace for the hero band. */
export default function WorkspaceMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-lp-line bg-lp-bg text-left shadow-[0_20px_60px_-20px_rgb(0_0_0/0.18)]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-[214px] shrink-0 flex-col border-r border-lp-line md:flex">
          <div className="flex h-12 items-center justify-between border-b border-lp-line px-4">
            <span className="flex items-center gap-2 text-[15px] font-medium text-lp-heading">
              <LeafIcon size={16} strokeWidth={2.4} className="text-brand" /> Sagewell
            </span>
            <PanelLeft className="size-4 text-lp-text" />
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 p-3">
            {NAV.map(({ icon: Icon, label, active }) => (
              <span
                key={label}
                className={
                  active
                    ? "flex items-center gap-2 rounded-md border border-lp-line bg-lp-bg px-2 py-1.5 text-[13px] text-lp-heading shadow-[0_1px_2px_rgb(0_0_0/0.05)]"
                    : "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-lp-text"
                }
              >
                <Icon className="size-3.5" /> {label}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-2 border-t border-lp-line px-4 py-3 text-[12px] text-lp-text">
            <HelpCircle className="size-3.5" /> Help and first steps
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <div className="flex h-12 items-center justify-between gap-3 border-b border-lp-line px-5">
            <span className="truncate text-[13px] font-medium text-lp-heading">Research methods notebook</span>
            <span className="hidden w-64 items-center gap-2 rounded-md border border-lp-line px-2.5 py-1 text-[12px] text-lp-text sm:flex">
              <Search className="size-3.5" /> Search sources…
              <span className="ml-auto rounded border border-lp-line px-1 font-dm-mono text-[10px]">⌘K</span>
            </span>
            <span className="size-6 shrink-0 rounded-full bg-gradient-to-br from-brand to-amber-300" />
          </div>

          <div className="space-y-4 p-5">
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {STATS.map(({ icon: Icon, tone, value, label }) => (
                <div key={label} className="rounded-lg border border-lp-line px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex size-6 items-center justify-center rounded-md ${tone}`}>
                      <Icon className="size-3.5" />
                    </span>
                    <span className="text-[17px] font-medium text-lp-heading">{value}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-lp-text">{label}</p>
                </div>
              ))}
            </div>

            {/* Sources table */}
            <div className="overflow-hidden rounded-lg border border-lp-line">
              <div className="px-4 py-3 text-[14px] font-medium text-lp-heading">Sources</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-[12px]">
                  <thead>
                    <tr className="border-y border-lp-line text-left text-lp-text">
                      <th className="px-4 py-2 font-normal">Name</th>
                      <th className="px-4 py-2 font-normal">Type</th>
                      <th className="px-4 py-2 font-normal">Status</th>
                      <th className="px-4 py-2 font-normal">Passages</th>
                      <th className="px-4 py-2 font-normal">Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map(({ icon: Icon, name, type, tone, status, dot, passages, added }) => (
                      <tr key={name} className="border-b border-lp-line last:border-0 text-lp-heading">
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-2">
                            <Icon className="size-3.5 text-lp-text" /> <span className="truncate">{name}</span>
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <Chip tone={tone} className="text-[11px]">{type}</Chip>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-1.5">
                            <span className={`size-1.5 rounded-full ${dot}`} /> {status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">{passages}</td>
                        <td className="px-4 py-2.5 text-lp-text">{added}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chat + summary */}
            <div className="grid gap-3 md:grid-cols-5">
              <div className="rounded-lg border border-lp-line p-4 md:col-span-3">
                <p className="text-[14px] font-medium text-lp-heading">Dialogue</p>
                <div className="mt-3 ml-auto w-fit max-w-[80%] rounded-lg bg-lp-soft px-3 py-2 text-[12px] text-lp-heading">
                  Why does attention scale by √dₖ?
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-lp-heading">
                  Large dot products push the softmax into regions with tiny gradients, so the scores are scaled
                  down to keep training stable <span className="text-brand">[1]</span>.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Chip tone="gray" className="text-[11px]">[1] attention-is-all-you-need.pdf · p.4</Chip>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-md border border-lp-line px-3 py-2 text-[12px] text-lp-text">
                  Ask a follow-up… <Send className="ml-auto size-3.5" />
                </div>
              </div>
              <div className="rounded-lg border border-lp-line p-4 md:col-span-2">
                <p className="text-[14px] font-medium text-lp-heading">Summary</p>
                <p className="mt-3 text-[12px] leading-relaxed text-lp-text">
                  Introduces the Transformer, a model built entirely on attention that trains faster and
                  parallelises better than recurrent networks.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="h-1.5 w-full rounded-full bg-lp-soft-2" />
                  <div className="h-1.5 w-4/5 rounded-full bg-lp-soft-2" />
                  <div className="h-1.5 w-3/5 rounded-full bg-lp-soft-2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
