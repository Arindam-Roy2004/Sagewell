import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Upload,
  Loader2,
  Check,
  Lock,
  Trash2,
  MoreHorizontal,
  Pencil,
  ChevronDown,
  ChevronUp,
  Search,
  Library,
  NotebookPen,
  Link2,
  CloudUpload,
  X,
  MessageSquarePlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useSourceStore } from '../stores/sourceStore';
import { useChatStore } from '../stores/chatStore';
import { getSourceMeta, getSourceName, describeSourceDeletion } from './workspace/source-meta';
import { SourceIcon, SourceStatus } from './workspace/source-badges';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.csv', '.txt'];
const COLLAPSED_COUNT = 6;

const ADD_MODES = [
  { key: 'text', label: 'Text', icon: NotebookPen },
  { key: 'upload', label: 'Upload', icon: CloudUpload },
  { key: 'url', label: 'Link', icon: Link2 },
];

/** Checks the extension; returns the file or null (with a toast). */
function acceptFile(file) {
  if (!file) return null;
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    toast.error('Please choose a PDF, Word (DOCX), CSV or TXT file.');
    return null;
  }
  return file;
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Square checkbox matching the shadcn checkbox. */
function SelectBox({ checked, locked, onToggle, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background dark:bg-input/30',
        locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3} />}
    </button>
  );
}

export default function SourcePanel({ headerActions }) {
  const {
    sources,
    selectedSource,
    selectedSourceIds,
    isUploading,
    isLoading,
    addTextSource,
    addFileSource,
    addUrlSource,
    selectSource,
    toggleSourceSelection,
    selectAllSources,
    clearSourceSelection,
    deleteSource,
    renameSource,
    expanded,
    setExpanded,
    hasMore,
    isLoadingMore,
    loadMoreSources,
  } = useSourceStore();
  const activeChatId = useChatStore((s) => s.activeChatId);
  const startNewChat = useChatStore((s) => s.startNewChat);
  const getSourceDeletionImpact = useChatStore((s) => s.getSourceDeletionImpact);
  const isChatActive = Boolean(activeChatId);

  const [addOpen, setAddOpen] = useState(false);
  const [activeInput, setActiveInput] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  const filtering = query.trim().length > 0;
  const filteredSources = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sources;
    return sources.filter((s) => getSourceName(s).toLowerCase().includes(q));
  }, [sources, query]);

  const visibleSources = filtering || expanded ? filteredSources : filteredSources.slice(0, COLLAPSED_COUNT);
  const hasExtra = !filtering && (sources.length > COLLAPSED_COUNT || hasMore);

  // Infinite scroll: when expanded and the user nears the bottom, fetch the next page.
  const handleListScroll = (e) => {
    if (!expanded || !hasMore || isLoadingMore) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      loadMoreSources();
    }
  };

  const openAdd = (mode = 'text') => {
    setActiveInput(mode);
    setAddOpen(true);
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    const result = await addTextSource(textInput);
    if (result.success) {
      setTextInput('');
      setAddOpen(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    const result = await addUrlSource(urlInput);
    if (result.success) {
      setUrlInput('');
      setAddOpen(false);
    }
  };

  const handleFileSubmit = async () => {
    if (!file) return;
    const result = await addFileSource(file);
    if (result.success) {
      setFile(null);
      setAddOpen(false);
    }
  };

  // The hidden input is also clicked from the content panel's "Upload" button, so a chosen
  // file opens the add dialog on the Upload tab.
  const handleFileChange = (e) => {
    const chosen = acceptFile(e.target.files?.[0]);
    e.target.value = '';
    if (chosen) {
      setFile(chosen);
      openAdd('upload');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const chosen = acceptFile(e.dataTransfer.files?.[0]);
    if (chosen) setFile(chosen);
  };

  const handleToggle = (id) => {
    if (isChatActive) {
      toast.info('Sources are locked to this dialogue. Start a new dialogue to choose different sources.');
    } else {
      toggleSourceSelection(id);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setPendingDelete(null);
    await deleteSource(id);
  };

  const submitting = isUploading;
  const canSubmit =
    (activeInput === 'text' && textInput.trim()) ||
    (activeInput === 'url' && urlInput.trim()) ||
    (activeInput === 'upload' && file);
  const submitLabel = activeInput === 'text' ? 'Add text' : activeInput === 'url' ? 'Add link' : 'Upload file';
  const onSubmit = activeInput === 'text' ? handleTextSubmit : activeInput === 'url' ? handleUrlSubmit : handleFileSubmit;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Always mounted: the content panel's empty state clicks this input directly. */}
      <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept={ALLOWED_EXTENSIONS.join(',')} />

      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border pr-2 pl-4">
        <div className="flex min-w-0 items-center gap-2">
          <Library className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">Sources</h2>
          {sources.length > 0 && (
            <Badge variant="muted" size="sm" className="tabular-nums">
              {sources.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button size="xs" variant="outline" onClick={() => openAdd('text')}>
            <Plus /> Add
          </Button>
          {headerActions}
        </div>
      </div>

      {/* Search + selection */}
      {sources.length > 0 && (
        <div className="shrink-0 space-y-2 border-b border-border px-3 py-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sources…"
              className="h-8 pl-8 pr-7 text-sm"
              aria-label="Search sources"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {isChatActive ? (
            <div className="flex items-center justify-between gap-2 rounded-md bg-muted/70 px-2.5 py-1.5" title="This dialogue keeps the sources it started with. Start a new dialogue to choose different ones.">
              <span className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
                <Lock className="size-3" /> Sources locked
              </span>
              <button
                type="button"
                onClick={startNewChat}
                className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-foreground underline-offset-4 hover:underline cursor-pointer"
              >
                <MessageSquarePlus className="size-3" /> New dialogue
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-0.5 text-xs">
              <span className="text-muted-foreground tabular-nums">
                {selectedSourceIds.length} of {sources.length} selected
              </span>
              <span className="flex items-center gap-2">
                <button type="button" onClick={selectAllSources} className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Select all
                </button>
                <span className="text-border">|</span>
                <button type="button" onClick={clearSourceSelection} className="text-muted-foreground hover:text-foreground cursor-pointer">
                  Clear
                </button>
              </span>
            </div>
          )}
        </div>
      )}

      {/* List */}
      <div className={cn('flex-1 overflow-y-auto px-2 py-2', !isLoading && sources.length === 0 && 'flex flex-col p-3')} onScroll={handleListScroll}>
        <ul className="space-y-0.5">
          {visibleSources.map((source) => {
            const id = source._id || source.id;
            const isChecked = selectedSourceIds.includes(id);
            const isViewing = selectedSource?._id === id;
            const isEditing = editingId === id;
            const displayName = getSourceName(source);
            const { label: typeLabel } = getSourceMeta(source.type);

            const saveRename = async () => {
              const t = editTitle.trim();
              setEditingId(null);
              if (t && t !== source.title) await renameSource(id, t);
            };

            return (
              <li
                key={id}
                className={cn(
                  'group flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors',
                  isViewing ? 'bg-accent' : 'hover:bg-accent/60',
                  !isEditing && 'cursor-pointer'
                )}
                onClick={() => !isEditing && selectSource(source)}
              >
                <SelectBox
                  checked={isChecked}
                  locked={isChatActive}
                  onToggle={() => handleToggle(id)}
                  label={`Include ${displayName} in questions`}
                />
                <SourceIcon type={source.type} />
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <Input
                      autoFocus
                      value={editTitle}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onBlur={saveRename}
                      className="h-7 px-2 text-sm"
                      aria-label="Source name"
                    />
                  ) : (
                    <p className={cn('truncate text-sm leading-tight', isViewing ? 'font-medium text-foreground' : 'text-foreground/90')}>
                      {displayName}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{typeLabel}</span>
                    <SourceStatus status={source.status} />
                  </div>
                </div>

                {!isEditing && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-background hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:bg-background data-[state=open]:opacity-100 cursor-pointer"
                        aria-label={`Actions for ${displayName}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent onClick={(e) => e.stopPropagation()} className="w-40">
                      <DropdownMenuItem
                        onSelect={() => {
                          setEditTitle(source.title || source.originalFileName || '');
                          setEditingId(id);
                        }}
                      >
                        <Pencil /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive [&_svg]:!text-destructive"
                        onSelect={() =>
                          setPendingDelete({ id, name: displayName, impact: getSourceDeletionImpact(id) })
                        }
                      >
                        <Trash2 /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </li>
            );
          })}
        </ul>

        {isLoading && sources.length === 0 && (
          <div className="space-y-1 animate-fade-in" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2.5 px-2 py-2">
                <div className="skeleton size-4 rounded-[4px]" />
                <div className="skeleton size-8 rounded-md" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-4/5" />
                  <div className="skeleton h-2.5 w-2/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && sources.length === 0 && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              handleDrop(e);
              if (e.dataTransfer.files?.[0]) openAdd('upload');
            }}
            className={cn(
              'flex min-h-[360px] flex-1 flex-col items-center justify-center rounded-lg border border-dashed px-5 py-8 text-center transition-colors',
              isDragging ? 'border-foreground/40 bg-accent' : 'border-border'
            )}
          >
            <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-background shadow-xs">
              <Library className="size-5 text-muted-foreground" />
            </span>
            <p className="mt-4 text-sm font-semibold text-foreground">Add your first source</p>
            <p className="mt-1 max-w-[230px] text-xs leading-relaxed text-muted-foreground">
              Drop a file here, or choose how you'd like to add one.
            </p>

            <div className="mt-5 grid w-full max-w-[240px] gap-2">
              <Button size="sm" onClick={() => document.getElementById('file-upload')?.click()}>
                <CloudUpload /> Upload a file
              </Button>
              <Button size="sm" variant="outline" onClick={() => openAdd('text')}>
                <NotebookPen /> Paste text
              </Button>
              <Button size="sm" variant="outline" onClick={() => openAdd('url')}>
                <Link2 /> Add a web page
              </Button>
            </div>

            <p className="mt-5 text-[11px] text-muted-foreground">PDF, Word, CSV or TXT · up to 50 MB</p>
          </div>
        )}

        {filtering && filteredSources.length === 0 && sources.length > 0 && (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">No sources match “{query}”.</p>
        )}

        {hasExtra && (
          <div className="pt-1">
            {!expanded ? (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <ChevronDown className="size-3.5" /> Show more
              </button>
            ) : (
              <>
                {isLoadingMore && (
                  <div className="flex justify-center py-2">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
                >
                  <ChevronUp className="size-3.5" /> Show less
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Add source dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => !submitting && setAddOpen(open)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a source</DialogTitle>
            <DialogDescription>Sagewell reads it, writes a short summary and makes it searchable.</DialogDescription>
          </DialogHeader>

          <div className="mt-5 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Source type">
            {ADD_MODES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeInput === key}
                onClick={() => setActiveInput(key)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-all cursor-pointer',
                  activeInput === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {activeInput === 'text' && (
              <div className="space-y-2">
                <Textarea
                  autoFocus
                  placeholder="Paste notes, an article or any text…"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="field-sizing-fixed h-48 overflow-y-auto"
                />
                <p className="text-right text-xs text-muted-foreground tabular-nums">
                  {textInput.length.toLocaleString()} characters
                </p>
              </div>
            )}

            {activeInput === 'upload' && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => document.getElementById('file-upload')?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') document.getElementById('file-upload')?.click();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  isDragging ? 'border-foreground/50 bg-accent' : 'border-border hover:bg-accent/50'
                )}
              >
                {file ? (
                  <>
                    <SourceIcon type={file.name.split('.').pop().toLowerCase()} className="size-10" iconClassName="size-5" />
                    <p className="mt-3 max-w-full truncate text-sm font-medium text-foreground">{file.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatBytes(file.size)} · click to choose another file</p>
                  </>
                ) : (
                  <>
                    <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-background shadow-xs">
                      <Upload className="size-4 text-muted-foreground" />
                    </span>
                    <p className="mt-3 text-sm font-medium text-foreground">Drop a file here, or click to browse</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">PDF, Word (DOCX), CSV or TXT · up to 50 MB</p>
                  </>
                )}
              </div>
            )}

            {activeInput === 'url' && (
              <div className="space-y-2">
                <div className="relative">
                  <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder="https://example.com/article"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUrlSubmit();
                    }}
                    className="pl-9"
                    aria-label="Web page address"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Works with articles, docs and most public pages.</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={!canSubmit || submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this source?"
        description={pendingDelete ? describeSourceDeletion(pendingDelete.name, pendingDelete.impact) : ''}
        confirmLabel="Delete source"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}

