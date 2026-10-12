import { motion, useReducedMotion } from 'motion/react';
import { ZapOff, BookOpen, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useCreditStore } from '../../stores/creditStore';
import { useAuthStore } from '../../stores/authStore';

const MotionSpan = motion.span;

// Optional contact address for requesting more credits. The button is hidden when unset.
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || '';

const STILL_WORKS = [
  { icon: BookOpen, text: 'Read your sources and their summaries' },
  { icon: MessagesSquare, text: 'Look back through your past dialogues' },
];

/** Shown when the server refuses an action for lack of credits (or the balance is already empty). */
export default function CreditsExhaustedDialog() {
  const open = useCreditStore((s) => s.exhaustedOpen);
  const setOpen = useCreditStore((s) => s.setExhaustedOpen);
  const setDialogOpen = useCreditStore((s) => s.setDialogOpen);
  const message = useCreditStore((s) => s.exhaustedMessage);
  const email = useAuthStore((s) => s.authUser?.email);
  const reduce = useReducedMotion();

  const mailto = SUPPORT_EMAIL
    ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Sagewell: request more credits')}&body=${encodeURIComponent(`Hi, I've used my credits. Account: ${email || ''}`)}`
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div className="relative flex size-14 items-center justify-center">
            {!reduce && (
              <MotionSpan
                aria-hidden
                className="absolute inset-0 rounded-full bg-destructive/20"
                animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
            <MotionSpan
              className="relative flex size-14 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10"
              initial={reduce ? false : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              <ZapOff className="size-6 text-destructive" />
            </MotionSpan>
          </div>

          <DialogHeader className="mt-5 items-center pr-0 text-center">
            <DialogTitle>You&apos;re out of credits</DialogTitle>
            <DialogDescription>
              {message || 'Your free credits have been used, so new questions and sources are paused.'}
            </DialogDescription>
          </DialogHeader>

          <ul className="mt-5 w-full space-y-1.5 rounded-lg border border-border bg-muted/40 p-3 text-left">
            <li className="text-mini font-medium uppercase tracking-wide text-muted-foreground">Still available</li>
            {STILL_WORKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2 text-sm text-foreground">
                <Icon className="size-3.5 text-muted-foreground" /> {text}
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row">
          <Button variant="outline" onClick={() => { setOpen(false); setDialogOpen(true); }}>
            View usage
          </Button>
          {mailto ? (
            <Button asChild variant="brand">
              <a href={mailto}>Request more credits</a>
            </Button>
          ) : (
            <Button onClick={() => setOpen(false)}>Got it</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
