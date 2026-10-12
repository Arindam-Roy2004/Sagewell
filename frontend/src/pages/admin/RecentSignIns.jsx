import { Monitor, Smartphone } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from './admin-utils';

/** Latest sign-ins across all accounts. Clicking one opens that account. */
export default function RecentSignIns({ signIns, onOpenUser }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-background p-4 shadow-xs">
      <p className="text-sm font-medium text-foreground">Recent sign-ins</p>

      {signIns.length === 0 ? (
        <p className="mt-3 flex flex-1 items-center justify-center rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          No sign-ins yet.
        </p>
      ) : (
        <ul className="-mx-2 mt-2 space-y-0.5">
          {signIns.slice(0, 6).map((s) => {
            const DeviceIcon = s.device.mobile ? Smartphone : Monitor;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onOpenUser(s.user.id)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-left transition-colors hover:bg-muted cursor-pointer"
                >
                  <Avatar src={s.user.avatar} name={s.user.name} className="size-7 text-[11px]" />
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-foreground">{s.user.name}</span>
                    {s.isNewUser && <Badge variant="brand" size="sm">New</Badge>}
                  </span>
                  <span
                    className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex"
                    title={`${s.device.browser} on ${s.device.os}`}
                  >
                    <DeviceIcon className="size-3.5" />
                    {s.device.browser}
                  </span>
                  <span className="w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{formatRelativeTime(s.at)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
