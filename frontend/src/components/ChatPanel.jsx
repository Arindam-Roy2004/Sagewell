import { useState, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
  ArrowUp,
  Square,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  Layers,
  Pencil,
  Trash2,
  X,
  Pin,
  PinOff,
  MoreHorizontal,
  Lock,
  ThumbsUp,
  ThumbsDown,
  SquarePen,
  Search,
  MessagesSquare,
  MessageSquareText,
  ListChecks,
  FlaskConical,
  GitCompareArrows,
  ArrowRight,
  ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import LeafIcon from './icons/leaf-icon';
import { useChatStore } from '../stores/chatStore';
import { useSourceStore } from '../stores/sourceStore';
import MessageContent from './MessageContent';
import Citations from './Citations';

const SUGGESTIONS = [
  { icon: ListChecks, text: 'Summarise the key findings in these sources.' },
  { icon: FlaskConical, text: 'What methods or arguments do they present?' },
  { icon: GitCompareArrows, text: 'Where do the sources agree or disagree?' },
];

function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Small icon button with a tooltip, for the message action row. */
function ActionButton({ label, onClick, active, activeClass, children }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          aria-pressed={active}
          className={cn(
            'flex size-7 items-center justify-center rounded-md transition-colors cursor-pointer [&_svg]:size-3.5',
            active ? activeClass : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function AssistantAvatar() {
  return (
    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-brand-app shadow-xs">
      <LeafIcon size={14} strokeWidth={2.3} />
    </span>
  );
}

export default function ChatPanel({ headerActions }) {
  const { sources, selectedSourceIds, selectSource, jumpToCitation } = useSourceStore();
  const {
    chats,
    activeChatId,
    activeChat,
    messages,
    isStreaming,
    isLoadingMessages,
    streamingContent,
    streamingCitations,
    fetchChats,
    selectChat,
    sendMessageStream,
    stopGeneration,
    regenerateMessage,
    startNewChat,
    renameChat,
    deleteChat,
    togglePinChat,
    setMessageFeedback,
  } = useChatStore();

  const [inputMessage, setInputMessage] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const isReadOnly = Boolean(activeChat?.isReadOnly);
  const messagesEndRef = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const atBottomRef = useRef(true); // avoids stale-closure reads inside the scroll effect
  const [showScrollPill, setShowScrollPill] = useState(false);

  // Initialize chats on mount (auto-select latest existing chat on first load)
  useEffect(() => {
    fetchChats(true);
  }, [fetchChats]);

  // Keyboard shortcuts: "/" focuses the composer, "Esc" stops generation.
  useEffect(() => {
    const onKey = (e) => {
      const el = document.activeElement;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        textareaRef.current?.focus();
      } else if (e.key === 'Escape' && isStreaming) {
        stopGeneration();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isStreaming, stopGeneration]);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setShowScrollPill(false);
    atBottomRef.current = true;
  };

  // Track whether the user is near the bottom. If they've scrolled up to read, we must
  // NOT auto-scroll on new tokens (that's the "yank-down" annoyance).
  const handleMessagesScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distance < 80;
    atBottomRef.current = atBottom;
    if (atBottom && showScrollPill) setShowScrollPill(false);
  };

  // Smart auto-scroll: follow new content only when already at the bottom; otherwise
  // surface a "new messages" pill so the user can jump down on their own terms.
  useEffect(() => {
    if (atBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setShowScrollPill(true);
    }
  }, [messages, streamingContent]);

  // Adjust textarea height dynamically
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isStreaming) return;
    if (isReadOnly) {
      toast.info('This dialogue is read-only because its sources were removed. Start a new dialogue.');
      return;
    }
    const msg = inputMessage;
    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    atBottomRef.current = true; // follow the new exchange the user just started
    await sendMessageStream(msg);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Copied to clipboard');
  };

  // Clicking a citation chip opens the matching source in the Document viewer at its page.
  const handleCitationSelect = (c) => {
    const match = sources.find(
      (s) =>
        (c.sourceId && (s._id === c.sourceId || s.id === c.sourceId)) ||
        s.originalFileName === c.originalFileName ||
        s.title === c.originalFileName
    );
    if (match) jumpToCitation(match, c.pageNumber);
    else if (selectSource) selectSource(match);
  };

  const handleNewChat = () => {
    setMenuOpen(false);
    startNewChat();
    toast.info('New dialogue started. Choose the sources to use, then ask a question.');
  };

  const confirmDeleteChat = async () => {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setPendingDelete(null);
    await deleteChat(id);
  };

  const saveHeaderRename = async () => {
    const t = renameValue.trim();
    setRenameOpen(false);
    if (activeChatId && t && t !== activeChat?.title) await renameChat(activeChatId, t);
  };

  // Find index of last assistant message to attach Regenerate button
  let lastAssistantIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      lastAssistantIndex = i;
      break;
    }
  }

  const filteredChats = useMemo(() => {
    const q = chatQuery.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => (c.title || 'Untitled dialogue').toLowerCase().includes(q));
  }, [chats, chatQuery]);

  const activeSourcesCount = selectedSourceIds.length;
  const currentChatTitle = activeChat?.title || (activeChatId ? 'Current dialogue' : 'New dialogue');
  const composerDisabled = isStreaming || activeSourcesCount === 0 || isReadOnly;

  return (
    <div className="relative flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border pr-2 pl-2">
        <DropdownMenu
          open={menuOpen}
          onOpenChange={(open) => {
            setMenuOpen(open);
            if (!open) {
              setChatQuery('');
              setEditingChatId(null);
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent data-[state=open]:bg-accent cursor-pointer"
            >
              {isReadOnly ? <Lock className="size-3.5 shrink-0 text-muted-foreground" /> : <MessagesSquare className="size-4 shrink-0 text-muted-foreground" />}
              <span className="truncate">{currentChatTitle}</span>
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-80 p-0" onKeyDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">Dialogues</span>
              <Button size="xs" variant="ghost" onClick={handleNewChat}>
                <SquarePen /> New
              </Button>
            </div>
            {chats.length > 4 && (
              <div className="border-b border-border p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    placeholder="Search dialogues…"
                    className="h-8 pl-8 text-sm"
                    aria-label="Search dialogues"
                  />
                </div>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto p-1">
              {filteredChats.map((c) => {
                const isEditing = editingChatId === c._id;
                const isActive = activeChatId === c._id;

                if (isEditing) {
                  const saveRename = async () => {
                    const t = editTitle.trim();
                    setEditingChatId(null);
                    if (t && t !== c.title) await renameChat(c._id, t);
                  };
                  return (
                    <div key={c._id} className="flex items-center gap-1 px-1.5 py-1">
                      <Input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename();
                          if (e.key === 'Escape') setEditingChatId(null);
                        }}
                        className="h-8 text-sm"
                        aria-label="Dialogue name"
                      />
                      <Button size="icon-sm" variant="ghost" onClick={saveRename} aria-label="Save name">
                        <Check />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => setEditingChatId(null)} aria-label="Cancel">
                        <X />
                      </Button>
                    </div>
                  );
                }

                return (
                  <div
                    key={c._id}
                    className={cn(
                      'group flex items-center gap-2 rounded-md py-1.5 pr-1 pl-2.5 transition-colors',
                      isActive ? 'bg-accent' : 'hover:bg-accent/60'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        selectChat(c._id);
                        setMenuOpen(false);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer"
                      title={c.title || 'Untitled dialogue'}
                    >
                      {c.pinned ? (
                        <Pin className="size-3.5 shrink-0 text-primary-strong" />
                      ) : (
                        <MessageSquareText className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className={cn('flex-1 truncate text-sm', isActive ? 'font-medium text-foreground' : 'text-foreground/90')}>
                        {c.title || 'Untitled dialogue'}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">{timeAgo(c.updatedAt || c.createdAt)}</span>
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-background hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 cursor-pointer"
                          aria-label={`Actions for ${c.title || 'dialogue'}`}
                        >
                          <MoreHorizontal className="size-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-40">
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditTitle(c.title || '');
                            setEditingChatId(c._id);
                          }}
                        >
                          <Pencil /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => togglePinChat(c._id)}>
                          {c.pinned ? <PinOff /> : <Pin />} {c.pinned ? 'Unpin' : 'Pin'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive [&_svg]:!text-destructive"
                          onSelect={() => {
                            setMenuOpen(false);
                            setPendingDelete({ id: c._id, title: c.title || 'Untitled dialogue' });
                          }}
                        >
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
              {chats.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No dialogues yet</p>}
              {chats.length > 0 && filteredChats.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No dialogues match “{chatQuery}”.</p>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={handleNewChat} aria-label="New dialogue">
                <SquarePen />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">New dialogue</TooltipContent>
          </Tooltip>

          {activeChatId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Dialogue actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44">
                <DropdownMenuItem
                  onSelect={() => {
                    setRenameValue(activeChat?.title || '');
                    setRenameOpen(true);
                  }}
                >
                  <Pencil /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => togglePinChat(activeChatId)}>
                  {activeChat?.pinned ? <PinOff /> : <Pin />} {activeChat?.pinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive [&_svg]:!text-destructive"
                  onSelect={() => setPendingDelete({ id: activeChatId, title: currentChatTitle })}
                >
                  <Trash2 /> Delete dialogue
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {headerActions}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleMessagesScroll}
        className={cn(
          'flex-1 space-y-7 overflow-y-auto px-4 py-6 md:px-5',
          messages.length === 0 && !isStreaming && !isLoadingMessages && 'flex flex-col justify-center'
        )}
      >
        {isLoadingMessages && messages.length === 0 && (
          <div className="space-y-7 animate-fade-in" aria-hidden="true">
            {[0, 1].map((i) => (
              <div key={i} className="space-y-3">
                <div className="skeleton ml-auto h-9 w-2/5 rounded-2xl" />
                <div className="flex gap-3">
                  <div className="skeleton size-7 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-11/12" />
                    <div className="skeleton h-3 w-4/5" />
                    <div className="skeleton h-3 w-3/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {messages.length === 0 && !isStreaming && !isLoadingMessages && (
          <div className="mx-auto flex max-w-sm animate-fade-in-up flex-col items-center pb-10 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl border border-border bg-background text-brand-app shadow-xs">
              <LeafIcon size={20} strokeWidth={2.2} />
            </span>
            <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
              {activeChatId ? activeChat?.title || 'Dialogue' : 'Ask your sources anything'}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {activeChatId
                ? 'Ask a question about the sources in this dialogue.'
                : activeSourcesCount > 0
                ? 'Answers cite the passages they come from. Try one of these to start:'
                : sources.length === 0
                ? 'Add a source on the left to start asking questions.'
                : 'Select one or more sources on the left, then ask a question.'}
            </p>

            {activeSourcesCount > 0 && !isReadOnly && (
              <div className="mt-5 flex w-full flex-col gap-2">
                {SUGGESTIONS.map(({ icon: Icon, text }) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => sendMessageStream(text)}
                    className="group flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm text-foreground/90 shadow-xs transition-colors hover:bg-accent cursor-pointer"
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1">{text}</span>
                    <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          const isLastAssistant = index === lastAssistantIndex && !isStreaming;

          if (isUser) {
            return (
              <div key={index} className="flex animate-fade-in-up justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-muted px-4 py-2.5 text-sm leading-relaxed text-foreground">
                  {message.content}
                </div>
              </div>
            );
          }

          return (
            <div key={index} className="group flex animate-fade-in-up gap-3">
              <AssistantAvatar />
              <div className="min-w-0 flex-1 space-y-2">
                <MessageContent content={message.content} />
                <Citations citations={message.citations} content={message.content} onSelect={handleCitationSelect} />

                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <ActionButton label={copiedIndex === index ? 'Copied' : 'Copy'} onClick={() => handleCopyMessage(message.content, index)}>
                    {copiedIndex === index ? <Check className="text-success" /> : <Copy />}
                  </ActionButton>
                  {isLastAssistant && (
                    <ActionButton label="Regenerate" onClick={regenerateMessage}>
                      <RotateCcw />
                    </ActionButton>
                  )}
                  <ActionButton
                    label="Good answer"
                    onClick={() => setMessageFeedback(index, 'up')}
                    active={message.feedback === 'up'}
                    activeClass="bg-success/10 text-success"
                  >
                    <ThumbsUp />
                  </ActionButton>
                  <ActionButton
                    label="Bad answer"
                    onClick={() => setMessageFeedback(index, 'down')}
                    active={message.feedback === 'down'}
                    activeClass="bg-destructive/10 text-destructive"
                  >
                    <ThumbsDown />
                  </ActionButton>
                </div>
              </div>
            </div>
          );
        })}

        {isStreaming && (
          <div className="flex animate-fade-in-up gap-3" aria-live="polite" aria-busy="true">
            <AssistantAvatar />
            <div className="min-w-0 flex-1 space-y-2">
              {streamingContent ? (
                <div>
                  <MessageContent content={streamingContent} />
                  <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-foreground/70 align-middle" />
                </div>
              ) : (
                <div className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                  </span>
                  Reading your sources…
                </div>
              )}
              <Citations citations={streamingCitations} content={streamingContent} onSelect={handleCitationSelect} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {showScrollPill && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-32 left-1/2 z-20 flex -translate-x-1/2 animate-fade-in-up items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-md transition-colors hover:bg-accent cursor-pointer"
        >
          <ArrowDown className="size-3.5" /> New messages
        </button>
      )}

      {/* Composer */}
      <div className="shrink-0 px-3 pt-1 pb-3 md:px-4">
        {isReadOnly && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            <Lock className="size-3.5 shrink-0" />
            <span className="flex-1">Read-only: the sources for this dialogue were removed.</span>
            <button type="button" onClick={handleNewChat} className="shrink-0 font-medium text-foreground hover:underline underline-offset-4 cursor-pointer">
              New dialogue
            </button>
          </div>
        )}

        <div
          className={cn(
            'rounded-xl border border-input bg-background shadow-xs transition-[box-shadow,border-color] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30 dark:bg-input/20',
            composerDisabled && !isStreaming && 'opacity-70'
          )}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={
              isReadOnly
                ? 'This dialogue is read-only'
                : activeSourcesCount === 0
                ? 'Select sources to start asking…'
                : 'Ask a question about your sources…'
            }
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={composerDisabled}
            aria-label="Message"
            className="block max-h-40 min-h-11 w-full resize-none overflow-y-auto bg-transparent px-3.5 pt-3 pb-1 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-1 text-xs',
                activeSourcesCount === 0 ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              <Layers className="size-3.5" />
              {activeSourcesCount === 0
                ? 'No sources selected'
                : `${activeSourcesCount} source${activeSourcesCount > 1 ? 's' : ''}`}
            </span>

            {isStreaming ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" onClick={stopGeneration} size="icon-sm" variant="outline" className="rounded-full" aria-label="Stop generating">
                    <Square className="size-3 fill-current" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Stop (Esc)</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || activeSourcesCount === 0 || isReadOnly}
                size="icon-sm"
                className="rounded-full"
                aria-label="Send message"
              >
                <ArrowUp />
              </Button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this dialogue?"
        description={pendingDelete ? `“${pendingDelete.title}” and all of its messages will be permanently deleted.` : ''}
        confirmLabel="Delete dialogue"
        destructive
        onConfirm={confirmDeleteChat}
      />

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename dialogue</DialogTitle>
            <DialogDescription>Give this dialogue a name you'll recognise later.</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            className="mt-4"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveHeaderRename();
            }}
            aria-label="Dialogue name"
          />
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveHeaderRename} disabled={!renameValue.trim()}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
