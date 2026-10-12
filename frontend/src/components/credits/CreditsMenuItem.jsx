import { Zap } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useCreditStore } from '../../stores/creditStore';
import CreditBar from './CreditBar';
import { creditTone, formatCredits, TONE_TEXT } from './credit-utils';

/** Profile menu row: balance, a mini bar, and a way into the full credits dialog. */
export default function CreditsMenuItem() {
  const credits = useCreditStore((s) => s.credits);
  const setDialogOpen = useCreditStore((s) => s.setDialogOpen);
  if (!credits) return null;
  const tone = creditTone(credits);

  return (
    <DropdownMenuItem onSelect={() => setDialogOpen(true)} className="flex-col items-stretch gap-2 py-2">
      <span className="flex items-center gap-2">
        <Zap className={cn('fill-current', tone === 'ok' ? 'text-brand-app!' : tone === 'low' ? 'text-warning!' : 'text-destructive!')} strokeWidth={0} />
        <span className="flex-1 text-foreground">Credits</span>
        <span className={cn('font-medium tabular-nums', TONE_TEXT[tone])}>
          {formatCredits(credits.balance)}
          <span className="font-normal text-muted-foreground"> / {formatCredits(credits.granted)}</span>
        </span>
      </span>
      <CreditBar credits={credits} className="h-1" />
    </DropdownMenuItem>
  );
}
