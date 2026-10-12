import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CreditBar from '@/components/credits/CreditBar';
import { formatCredits } from '@/components/credits/credit-utils';
import { cn } from '@/lib/utils';
import { useAdminStore } from '../../stores/adminStore';
import Presence from './Presence';

const SORT_OPTIONS = [
  { value: 'active', label: 'Last active' },
  { value: 'newest', label: 'Newest' },
  { value: 'signins', label: 'Most sign-ins' },
  { value: 'credits', label: 'Most credits used' },
];

const selectClass =
  'h-8 cursor-pointer rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30';

const joined = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/** All accounts: search, sort, page. A row opens the account sheet. */
export default function UsersTable() {
  const { users, pagination, query, isLoadingUsers, fetchUsers, openUser } = useAdminStore();
  const [search, setSearch] = useState(query.q);

  // Search as you type, debounced.
  useEffect(() => {
    if (search === query.q) return undefined;
    const t = setTimeout(() => fetchUsers({ q: search, page: 1 }), 300);
    return () => clearTimeout(t);
  }, [search, query.q, fetchUsers]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium">Accounts</h2>
          <Badge variant="muted" size="sm" className="tabular-nums">{pagination.total}</Badge>
          {isLoadingUsers && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-56 sm:flex-none">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="h-8 pl-8" aria-label="Search users" />
          </div>
          <select value={query.sort} onChange={(e) => fetchUsers({ sort: e.target.value, page: 1 })} className={selectClass} aria-label="Sort users">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-border">
        <table className={cn('w-full min-w-[720px] text-left text-sm transition-opacity', isLoadingUsers && 'opacity-60')}>
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="w-[36%] px-4 py-2 font-medium">User</th>
              <th className="px-3 py-2 font-medium">Last active</th>
              <th className="px-3 py-2 font-medium">Joined</th>
              <th className="w-20 px-3 py-2 text-right font-medium">Sign-ins</th>
              <th className="w-20 px-3 py-2 text-right font-medium">Sources</th>
              <th className="w-16 px-3 py-2 text-right font-medium">Chats</th>
              <th className="w-36 px-4 py-2 font-medium">Credits</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} onClick={() => openUser(u.id)} className="cursor-pointer transition-colors hover:bg-muted/40">
                <td className="max-w-[260px] px-4 py-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={u.avatar} name={u.name} className="size-7 text-[11px]" />
                    <div className="min-w-0 leading-tight">
                      <p className="flex items-center gap-1.5">
                        <span className="truncate font-medium text-foreground">{u.name}</span>
                        {u.role === 'admin' && <Badge variant="brand" size="sm">Admin</Badge>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2"><Presence lastActiveAt={u.lastActiveAt} /></td>
                <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">{joined(u.createdAt)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{u.loginCount}</td>
                <td className="px-3 py-2 text-right tabular-nums">{u.sources}</td>
                <td className="px-3 py-2 text-right tabular-nums">{u.chats}</td>
                <td className="px-4 py-2">
                  <div className="w-24">
                    <p className={cn('text-xs tabular-nums', u.credits.exhausted ? 'text-destructive' : 'text-foreground')}>
                      {formatCredits(u.credits.balance)}
                      <span className="text-muted-foreground">/{formatCredits(u.credits.granted)}</span>
                    </p>
                    <CreditBar credits={u.credits} className="mt-0.5 h-1" />
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && !isLoadingUsers && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  {query.q ? 'No matches.' : 'No users yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <span className="tabular-nums">{pagination.page} / {pagination.pages}</span>
          <div className="flex gap-1.5">
            <Button variant="outline" size="icon-xs" aria-label="Previous page" disabled={pagination.page <= 1 || isLoadingUsers} onClick={() => fetchUsers({ page: pagination.page - 1 })}>
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon-xs" aria-label="Next page" disabled={pagination.page >= pagination.pages || isLoadingUsers} onClick={() => fetchUsers({ page: pagination.page + 1 })}>
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
