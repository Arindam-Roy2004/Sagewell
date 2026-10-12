import { useState } from 'react';
import { X, Monitor, Smartphone, Plus, Loader2, MessageSquare, FileText, Undo2, Gift } from 'lucide-react';
import { Dialog, SheetContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import CreditBar from '@/components/credits/CreditBar';
import { formatCredits } from '@/components/credits/credit-utils';
import { SourceIcon, SourceStatus } from '@/components/workspace/source-badges';
import { cn } from '@/lib/utils';
import { useAdminStore } from '../../stores/adminStore';
import Presence from './Presence';
import { formatDateTime, formatRelativeTime } from './admin-utils';

const PRESETS = [25, 50, 100];
const TX_ICON = { chat: MessageSquare, source: FileText, refund: Undo2, grant: Gift };

function Section({ title, children, aside }) {
  return (
    <section className="space-y-1.5">
      <div className="flex items-center justify-between">
        <h3 className="text-label text-muted-foreground">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Fact({ label, children }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium text-foreground tabular-nums">{children}</div>
    </div>
  );
}

const Empty = ({ children }) => (
  <p className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-sm text-muted-foreground">{children}</p>
);

function AddCredits({ userId }) {
  const { addCredits, isGranting } = useAdminStore();
  const [amount, setAmount] = useState('');
  const value = Number(amount);
  const valid = Number.isInteger(value) && value >= 1 && value <= 1000;

  const submit = async (credits) => {
    if (await addCredits(userId, credits)) setAmount('');
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PRESETS.map((n) => (
        <Button key={n} variant="outline" size="xs" disabled={isGranting} onClick={() => submit(n)}>
          +{n}
        </Button>
      ))}
      <form
        className="flex flex-1 items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) submit(value);
        }}
      >
        <Input
          type="number"
          min={1}
          max={1000}
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="h-7 min-w-0 flex-1 text-xs"
          aria-label="Credits to add"
        />
        <Button type="submit" size="xs" disabled={!valid || isGranting}>
          {isGranting ? <Loader2 className="animate-spin" /> : <Plus />} Add
        </Button>
      </form>
    </div>
  );
}

/** Side sheet for one account: who they are, how they sign in, and what they have used. */
export default function UserSheet() {
  const { selectedUserId, selectedUser, isLoadingUser, closeUser } = useAdminStore();
  const data = selectedUser;
  const user = data?.user;

  return (
    <Dialog open={Boolean(selectedUserId)} onOpenChange={(open) => !open && closeUser()}>
      {selectedUserId && (
        <SheetContent>
          <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-5">
            {user ? (
              <div className="flex min-w-0 items-center gap-3">
                <Avatar src={user.avatar} name={user.name} className="size-8 text-[11px]" />
                <div className="min-w-0">
                  <DialogTitle className="flex items-center gap-1.5 truncate text-sm font-semibold">
                    {user.name}
                    {user.role === 'admin' && <Badge variant="brand" size="sm">Admin</Badge>}
                  </DialogTitle>
                  <DialogDescription className="truncate text-xs">{user.email}</DialogDescription>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="space-y-1.5">
                  <DialogTitle className="sr-only">Loading account</DialogTitle>
                  <DialogDescription className="sr-only">Fetching account details</DialogDescription>
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
            )}
            <Button variant="ghost" size="icon-sm" onClick={closeUser} aria-label="Close">
              <X />
            </Button>
          </div>

          {!user || isLoadingUser ? (
            <div className="space-y-3 p-5">
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-40 rounded-lg" />
            </div>
          ) : (
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Fact label="Last active"><Presence lastActiveAt={user.lastActiveAt} /></Fact>
                <Fact label="Joined">{new Date(user.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</Fact>
                <Fact label="Sign-ins">{user.loginCount}</Fact>
                <Fact label="Sources / chats">{user.sources} / {user.chats}</Fact>
              </div>

              <Section title="Credits">
                <div className="space-y-2.5 rounded-lg border border-border p-3">
                  <div className="flex items-baseline justify-between">
                    <p className={cn('text-xl font-semibold tabular-nums', user.credits.exhausted ? 'text-destructive' : 'text-foreground')}>
                      {formatCredits(user.credits.balance)}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">of {formatCredits(user.credits.granted)} left</span>
                    </p>
                    <span className="text-xs text-muted-foreground tabular-nums">{formatCredits(user.credits.spent)} used</span>
                  </div>
                  <CreditBar credits={user.credits} />
                  <AddCredits userId={user.id} />
                </div>
              </Section>

              <Section title="Sign-in history">
                {data.signIns.length === 0 ? (
                  <Empty>No sign-ins yet.</Empty>
                ) : (
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {data.signIns.map((s) => {
                      const DeviceIcon = s.device.mobile ? Smartphone : Monitor;
                      return (
                        <li key={s.id} className="flex items-center gap-3 px-3 py-2">
                          <DeviceIcon className="size-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 text-sm text-foreground">
                              {s.device.browser} on {s.device.os}
                              {s.isNewUser && <Badge variant="brand" size="sm">First sign-in</Badge>}
                            </p>
                            <p className="truncate font-mono text-xs text-muted-foreground">{s.ip || 'Unknown IP'}</p>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground" title={formatDateTime(s.at)}>{formatRelativeTime(s.at)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Section>

              <Section title="Credit activity">
                {data.transactions.length === 0 ? (
                  <Empty>None yet.</Empty>
                ) : (
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {data.transactions.map((tx) => {
                      const Icon = TX_ICON[tx.kind] || FileText;
                      const credit = tx.kind === 'refund' || tx.kind === 'grant';
                      return (
                        <li key={tx.id} className="flex items-center gap-3 px-3 py-2">
                          <Icon className="size-4 shrink-0 text-muted-foreground" />
                          <p className="min-w-0 flex-1 truncate text-sm text-foreground">{tx.label || 'Activity'}</p>
                          <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(tx.createdAt)}</span>
                          <span className={cn('w-12 shrink-0 text-right font-mono text-xs tabular-nums', credit ? 'text-success' : 'text-foreground')}>
                            {credit ? '+' : '−'}{formatCredits(tx.amount)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Section>

              <Section title="Sources">
                {data.sources.length === 0 ? (
                  <Empty>None yet.</Empty>
                ) : (
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {data.sources.map((s) => (
                      <li key={s.id} className="flex items-center gap-3 px-3 py-2">
                        <SourceIcon type={s.type} className="size-7" iconClassName="size-3.5" />
                        <p className="min-w-0 flex-1 truncate text-sm text-foreground">{s.name}</p>
                        <SourceStatus status={s.status} />
                        <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(s.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
          )}
        </SheetContent>
      )}
    </Dialog>
  );
}
