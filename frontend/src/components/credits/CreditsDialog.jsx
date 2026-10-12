import { motion, useReducedMotion } from 'motion/react';
import { MessageSquare, NotebookPen, CloudUpload, Link2, FileText, Undo2, Zap, Gift } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCreditStore } from '../../stores/creditStore';
import AnimatedNumber from './AnimatedNumber';
import CreditBar from './CreditBar';
import { creditTone, formatCredits, formatRelativeTime, TONE_BADGE, TONE_LABEL, TONE_TEXT } from './credit-utils';

const MotionLi = motion.li;

const KIND_ICON = { chat: MessageSquare, source: FileText, refund: Undo2, grant: Gift };
const isAddition = (tx) => tx.kind === 'refund' || tx.kind === 'grant';

/** Icon in a bordered square, the same treatment as the source type badges. */
function IconTile({ icon: Icon, className }) {
  return (
    <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background shadow-xs', className)}>
      <Icon className="size-4 text-muted-foreground" />
    </span>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 dark:bg-input/20">
      <p className="text-mini font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function costRows(pricing, credits) {
  const link = pricing.linkSource;
  return [
    { icon: MessageSquare, label: 'Ask a question', hint: 'Depends on how much it reads', cost: `${pricing.chatAnswer.from}–${pricing.chatAnswer.to}` },
    { icon: NotebookPen, label: 'Add pasted text', hint: 'Grows with length', cost: `from ${pricing.textSource.from}` },
    { icon: CloudUpload, label: 'Upload a file', hint: `Up to ${pricing.fileSource.maxMb} MB`, cost: `from ${pricing.fileSource.from}` },
    {
      icon: Link2,
      label: 'Add a web link',
      hint: `${credits.urlSources.used} of ${link.limit} link${link.limit === 1 ? '' : 's'} used`,
      cost: `from ${link.from}`,
    },
  ];
}

export default function CreditsDialog() {
  const open = useCreditStore((s) => s.dialogOpen);
  const setOpen = useCreditStore((s) => s.setDialogOpen);
  const credits = useCreditStore((s) => s.credits);
  const pricing = useCreditStore((s) => s.pricing);
  const transactions = useCreditStore((s) => s.transactions);
  const reduce = useReducedMotion();

  if (!credits) return null;
  const tone = creditTone(credits);
  const item = (i) => (reduce ? {} : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.05 + i * 0.04, duration: 0.25 } });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Credits</DialogTitle>
          <DialogDescription>Credits pay for the AI work behind your answers and sources.</DialogDescription>
        </DialogHeader>

        {/* Balance */}
        <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-baseline gap-1.5">
                <AnimatedNumber value={credits.balance} className={cn('text-4xl font-semibold tracking-tight tabular-nums', TONE_TEXT[tone])} />
                <span className="text-sm text-muted-foreground">of {formatCredits(credits.granted)} left</span>
              </p>
            </div>
            <Badge variant={TONE_BADGE[tone]}>
              <Zap className="fill-current" /> {TONE_LABEL[tone]}
            </Badge>
          </div>
          <CreditBar credits={credits} className="mt-4" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Used" value={formatCredits(credits.spent)} />
            <Stat label="Left" value={formatCredits(credits.balance)} />
            <Stat label="Web links" value={`${credits.urlSources.used}/${credits.urlSources.max}`} />
          </div>
        </div>

        {/* Costs */}
        <section className="mt-6" aria-labelledby="credit-costs">
          <h3 id="credit-costs" className="text-sm font-medium text-foreground">What things cost</h3>
          <ul className="mt-2 divide-y divide-hairline rounded-lg border border-border">
            {pricing
              ? costRows(pricing, credits).map((row, i) => (
                  <MotionLi key={row.label} className="flex items-center gap-3 px-3 py-2.5" {...item(i)}>
                    <IconTile icon={row.icon} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{row.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.hint}</p>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-foreground tabular-nums">{row.cost} credits</span>
                  </MotionLi>
                ))
              : [0, 1, 2, 3].map((i) => (
                  <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="h-4 w-40" />
                  </li>
                ))}
          </ul>
        </section>

        {/* Activity */}
        <section className="mt-6" aria-labelledby="credit-activity">
          <h3 id="credit-activity" className="text-sm font-medium text-foreground">Recent activity</h3>
          {transactions.length === 0 ? (
            <p className="mt-2 rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
              Nothing yet. Credits you use will show up here.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-hairline rounded-lg border border-border">
              {transactions.map((tx, i) => (
                <MotionLi key={tx.id} className="flex items-center gap-3 px-3 py-2.5" {...item(i)}>
                  <IconTile icon={KIND_ICON[tx.kind] || FileText} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{tx.label || 'Activity'}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(tx.createdAt)}</p>
                  </div>
                  <span className={cn('shrink-0 font-mono text-xs tabular-nums', isAddition(tx) ? 'text-success' : 'text-foreground')}>
                    {isAddition(tx) ? '+' : '−'}
                    {formatCredits(tx.amount)}
                  </span>
                </MotionLi>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-5 text-xs text-muted-foreground">
          Credits don&apos;t renew on their own. You only pay for what is actually used, and a failed source returns its credits.
        </p>
      </DialogContent>
    </Dialog>
  );
}
