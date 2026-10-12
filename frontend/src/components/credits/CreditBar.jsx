import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { creditTone, TONE_BAR } from './credit-utils';

const MotionDiv = motion.div;

/** Thin progress bar for the remaining balance. Width springs to its value; colour follows the state. */
export default function CreditBar({ credits, className }) {
  const reduce = useReducedMotion();
  const tone = creditTone(credits);
  const pct = credits?.granted > 0 ? Math.min(100, Math.max(0, (credits.balance / credits.granted) * 100)) : 0;

  return (
    <div
      role="progressbar"
      aria-label="Credits remaining"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <MotionDiv
        className={cn('h-full rounded-full transition-colors', TONE_BAR[tone])}
        initial={reduce ? false : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 22 }}
      />
    </div>
  );
}
