import { useEffect } from 'react';
import { Zap } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useCreditStore } from '../../stores/creditStore';
import AnimatedNumber from './AnimatedNumber';
import CreditBar from './CreditBar';
import { creditTone, formatCredits, TONE_TEXT } from './credit-utils';

/** Header pill: remaining credits at a glance. Click to open the details dialog. */
export default function CreditMeter({ className }) {
  const credits = useCreditStore((s) => s.credits);
  const setDialogOpen = useCreditStore((s) => s.setDialogOpen);
  const hasPricing = useCreditStore((s) => Boolean(s.pricing));
  const fetchCredits = useCreditStore((s) => s.fetchCredits);

  // The balance arrives with the user; prices (for the cost hints) need one fetch.
  useEffect(() => {
    if (credits && !hasPricing) fetchCredits();
  }, [credits, hasPricing, fetchCredits]);

  if (!credits) return null;
  const tone = creditTone(credits);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          aria-label={`${formatCredits(credits.balance)} credits left. Open credits`}
          className={cn(
            'group flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-sm shadow-xs transition-colors hover:bg-accent cursor-pointer dark:bg-input/30',
            tone === 'empty' && 'border-destructive/40',
            className
          )}
        >
          <Zap
            className={cn(
              'size-3.5 transition-colors',
              tone === 'ok' && 'text-brand-app',
              tone === 'low' && 'text-warning',
              tone === 'empty' && 'text-destructive'
            )}
            fill="currentColor"
            strokeWidth={0}
          />
          <AnimatedNumber value={credits.balance} className={cn('font-medium tabular-nums', TONE_TEXT[tone])} />
          <span className="hidden text-muted-foreground sm:inline">credits</span>
          <CreditBar credits={credits} className="ml-0.5 hidden h-1 w-8 lg:block" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {formatCredits(credits.balance)} of {formatCredits(credits.granted)} credits left
      </TooltipContent>
    </Tooltip>
  );
}
