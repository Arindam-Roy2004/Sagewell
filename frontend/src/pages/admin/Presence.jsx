import { cn } from '@/lib/utils';
import { presence, formatRelativeTime } from './admin-utils';

/** "Online" with a live dot, otherwise when the account was last active. */
export default function Presence({ lastActiveAt, className }) {
  const state = presence(lastActiveAt);
  if (state === 'online') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-success', className)}>
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-success" />
        </span>
        Online
      </span>
    );
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
      <span className={cn('size-2 rounded-full', state === 'recent' ? 'bg-success/50' : 'bg-muted-foreground/30')} />
      {state === 'never' ? 'Not seen yet' : formatRelativeTime(lastActiveAt)}
    </span>
  );
}
