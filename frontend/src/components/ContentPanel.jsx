import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  CircleAlert,
  ExternalLink,
  Upload,
  CircleHelp,
  AlignLeft,
  BookOpenText,
  MoreHorizontal,
  Trash2,
  Globe,
  FileQuestion,
  Library,
  MessageSquareText,
  Quote,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useSourceStore } from '../stores/sourceStore';
import { axiosInstance } from '../lib/axios';
import { getSourceMeta, getSourceName } from './workspace/source-meta';
import { SourceIcon, SourceStatus } from './workspace/source-badges';

const STEPS = [
  { icon: Library, title: "Add sources", text: "Upload PDF, Word, CSV or text files, paste notes, or add a web page from the Sources panel." },
  { icon: MessageSquareText, title: "Ask questions", text: "Select the sources to use, then ask in the Dialogue panel. Follow-up questions keep the context." },
  { icon: Quote, title: "Check citations", text: "Answers number the passages they used. Click a citation to open the source at that spot." },
];

const TABS = [
  { key: "summary", label: "Summary", icon: AlignLeft },
  { key: "document", label: "Document", icon: BookOpenText },
];

function statusMessage(status) {
  switch (status) {
    case 'uploading': return 'Uploading the file…';
    case 'queued': return 'Waiting to be processed…';
    case 'processing': return 'Reading and summarising…';
    default: return 'Processing source…';
  }
}

/** Centered message used by the empty and error states of the document tab. */
function Placeholder({ icon: Icon, title, text, children, tone = "muted" }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-xl border",
          tone === "error" ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-border bg-muted/50 text-muted-foreground"
        )}
      >
        <Icon className="size-5" />
      </span>
      {title && <p className="mt-4 text-sm font-medium text-foreground">{title}</p>}
      {text && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{text}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export default function ContentPanel({ headerActions }) {
  const { sources, selectedSource, getViewUrl, citationJump, deleteSource } = useSourceStore();
  const [isLoadingViewUrl, setIsLoadingViewUrl] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [showTutorial, setShowTutorial] = useState(false);
  const [viewerPage, setViewerPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const sourceId = selectedSource?._id || selectedSource?.id;
  const type = selectedSource?.type;
  const isFileType = selectedSource && ['pdf', 'docx', 'csv', 'text'].includes(type);
  // Which sources can render inside an <iframe> in the browser.
  const isEmbeddable = ['pdf', 'text', 'csv'].includes(type);
  const webUrl = selectedSource?.rawURL || selectedSource?.webURL;
  const canOpenOriginal = isFileType && selectedSource?.status === 'completed' && selectedSource?.s3Key;

  // When a citation is clicked, jump to the Document tab at the cited page.
  useEffect(() => {
    if (citationJump && citationJump.sourceId === sourceId) {
      setViewerPage(citationJump.page || 1);
      setActiveTab('document');
    }
  }, [citationJump, sourceId]);

  // Reset the page when switching sources.
  useEffect(() => {
    setViewerPage(1);
  }, [sourceId]);

  // React Query caches the presigned URL (valid ~1h) so switching tabs/pages doesn't refetch.
  const canViewDoc = Boolean(sourceId && isEmbeddable && selectedSource?.status === 'completed' && selectedSource?.s3Key);
  const { data: viewUrl, isLoading: isViewLoading, isError: isViewError } = useQuery({
    queryKey: ['view-url', sourceId],
    enabled: canViewDoc && activeTab === 'document',
    staleTime: 50 * 60 * 1000, // under the 1h presign expiry
    queryFn: async () => {
      const res = await axiosInstance.get(`/source/${sourceId}/view-url`);
      return res.data?.viewUrl;
    },
  });

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const handleViewFile = async () => {
    if (!sourceId) return;
    setIsLoadingViewUrl(true);
    const url = await getViewUrl(sourceId);
    setIsLoadingViewUrl(false);
    if (url) window.open(url, '_blank');
  };

  const openOriginal = () => {
    if (type === 'link' && webUrl) window.open(webUrl, '_blank', 'noopener');
    else handleViewFile();
  };

  // ── Document tab ────────────────────────────────────────────────────────────
  const renderDocument = () => {
    if (!selectedSource) {
      return <Placeholder icon={BookOpenText} title="No source selected" text="Choose a source on the left to read it here." />;
    }

    // Web pages usually block embedding, so offer to open them.
    if (type === 'link') {
      return (
        <Placeholder icon={Globe} title="Web pages open in a new tab" text="Most sites don't allow being shown inside another page.">
          <Button asChild variant="outline" size="sm">
            <a href={webUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink /> Open web page
            </a>
          </Button>
        </Placeholder>
      );
    }

    if (!isEmbeddable || !selectedSource.s3Key) {
      return (
        <Placeholder icon={FileQuestion} title="No preview for this file type" text="Open the original file to read it.">
          <Button variant="outline" size="sm" onClick={handleViewFile} disabled={isLoadingViewUrl}>
            {isLoadingViewUrl ? <Loader2 className="animate-spin" /> : <ExternalLink />} Open original
          </Button>
        </Placeholder>
      );
    }

    if (selectedSource.status !== 'completed') {
      return (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> {statusMessage(selectedSource.status)}
        </div>
      );
    }

    if (isViewLoading) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (isViewError || !viewUrl) {
      return (
        <Placeholder icon={CircleAlert} tone="error" title="Couldn't load the document" text="Try opening the original file instead.">
          <Button variant="outline" size="sm" onClick={handleViewFile} disabled={isLoadingViewUrl}>
            <ExternalLink /> Open original
          </Button>
        </Placeholder>
      );
    }

    // PDFs support the #page fragment to jump to the cited page.
    const src = type === 'pdf' ? `${viewUrl}#page=${viewerPage}` : viewUrl;
    return (
      <div className="min-h-0 flex-1 bg-muted/40">
        <iframe key={`${sourceId}-${viewerPage}`} title={getSourceName(selectedSource)} src={src} className="h-full w-full border-0" />
      </div>
    );
  };

  // ── Summary tab ─────────────────────────────────────────────────────────────
  const renderSummary = () => {
    // Sources exist but none is open: a short prompt instead of repeating the onboarding.
    if (!selectedSource && sources.length > 0) {
      return (
        <Placeholder icon={BookOpenText} title="Pick a source to read" text="Choose a source on the left to see its summary, or open the document." />
      );
    }
    if (!selectedSource) {
      return (
        <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-10">
          <div className="w-full max-w-lg animate-fade-in-up text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-xl border border-border bg-muted/50 shadow-xs">
              <BookOpenText className="size-5 text-muted-foreground" />
            </span>
            <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">Start with a source</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Add a document, a web page or some notes. Sagewell summarises it, and you can ask questions with answers that cite the
              exact passage.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button onClick={() => document.getElementById('file-upload')?.click()}>
                <Upload /> Upload a file
              </Button>
              <Button variant="outline" onClick={() => setShowTutorial(true)}>
                <CircleHelp /> How it works
              </Button>
            </div>
            <div className="mt-10 grid gap-3 text-left sm:grid-cols-3">
              {STEPS.map(({ icon: Icon, title }, i) => (
                <div key={title} className="rounded-lg border border-border bg-background p-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground tabular-nums">
                      {i + 1}
                    </span>
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-sm font-medium text-foreground">{title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const isWorking = ['uploading', 'queued', 'processing'].includes(selectedSource.status);

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 py-8 md:px-10">
          <div className="flex items-start gap-3">
            <SourceIcon type={type} className="size-10" iconClassName="size-5" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{getSourceMeta(type).label}</span>
                {selectedSource.createdAt && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3" /> {formatDate(selectedSource.createdAt)}
                  </span>
                )}
                <SourceStatus status={selectedSource.status} showReady />
              </div>
              <h1 className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight text-foreground">{getSourceName(selectedSource)}</h1>
              {webUrl && (
                <a
                  href={webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex max-w-full items-center gap-1 truncate text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  <ExternalLink className="size-3.5 shrink-0" />
                  <span className="truncate">{webUrl}</span>
                </a>
              )}
            </div>
          </div>

          {canOpenOriginal && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {isEmbeddable && (
                <Button variant="outline" size="sm" onClick={() => setActiveTab('document')}>
                  <BookOpenText /> Read document
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleViewFile} disabled={isLoadingViewUrl}>
                {isLoadingViewUrl ? <Loader2 className="animate-spin" /> : <ExternalLink />} Open original
              </Button>
            </div>
          )}

          <div className="mt-8 border-t border-border pt-6">
            <p className="text-label text-muted-foreground">Summary</p>

            {selectedSource.status === 'completed' && selectedSource.summary && (
              <p className="mt-3 animate-fade-in-up whitespace-pre-wrap text-[15px] leading-7 text-foreground/90">{selectedSource.summary}</p>
            )}

            {selectedSource.status === 'completed' && !selectedSource.summary && (
              <p className="mt-3 text-sm text-muted-foreground">This source was processed, but no summary is available.</p>
            )}

            {selectedSource.status === 'failed' && (
              <div className="mt-3 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">Processing failed</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {selectedSource.errorMessage || "Something went wrong while reading this source."}
                  </p>
                </div>
              </div>
            )}

            {isWorking && (
              <div className="mt-4 animate-fade-in-up">
                <div className="space-y-2.5">
                  {['w-11/12', 'w-full', 'w-3/4', 'w-5/6', 'w-3/5'].map((w) => (
                    <div key={w} className={`skeleton h-3.5 ${w}`} />
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> {statusMessage(selectedSource.status)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border pr-2 pl-3">
        <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5" role="tablist" aria-label="View">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all cursor-pointer",
                activeTab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {selectedSource && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Source actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44">
                {(canOpenOriginal || webUrl) && (
                  <DropdownMenuItem onSelect={openOriginal}>
                    <ExternalLink /> Open original
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => setShowTutorial(true)}>
                  <CircleHelp /> How it works
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive [&_svg]:!text-destructive"
                  onSelect={() => setConfirmDelete(true)}
                >
                  <Trash2 /> Delete source
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {headerActions}
        </div>
      </div>

      {activeTab === 'document' ? renderDocument() : renderSummary()}

      {/* How it works */}
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>How Sagewell works</DialogTitle>
            <DialogDescription>Three steps from a pile of documents to answers you can check.</DialogDescription>
          </DialogHeader>
          <ol className="mt-6 space-y-5">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="flex gap-3.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
                  <Icon className="size-4 text-muted-foreground" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {i + 1}. {title}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <Button className="mt-7 w-full" onClick={() => setShowTutorial(false)}>
            Got it
          </Button>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this source?"
        description={
          selectedSource
            ? `“${getSourceName(selectedSource)}” and its passages will be removed. Dialogues that relied only on it become read-only.`
            : ''
        }
        confirmLabel="Delete source"
        destructive
        onConfirm={async () => {
          setConfirmDelete(false);
          if (sourceId) await deleteSource(sourceId);
        }}
      />
    </div>
  );
}
