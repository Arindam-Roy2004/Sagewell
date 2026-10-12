import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const MotionDiv = motion.div;

const label = (date, opts) => new Date(`${date}T00:00:00`).toLocaleDateString(undefined, opts);

/**
 * Daily sign-ins, last 14 days. One series, so one hue and no legend. Hover or focus a bar for
 * that day's numbers; a hidden table carries the same data for screen readers.
 */
export default function SignInChart({ series = [] }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(null);
  const max = Math.max(1, ...series.map((d) => d.signIns));
  const totalSignIns = series.reduce((n, d) => n + d.signIns, 0);
  const totalSignUps = series.reduce((n, d) => n + d.signUps, 0);
  const last = series.length - 1;

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-background p-4 shadow-xs">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-foreground">Sign-ins · 14 days</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          <span className="font-medium text-foreground">{totalSignIns}</span> total · {totalSignUps} new
        </p>
      </div>

      <div className="relative mt-3 flex flex-1 flex-col">
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-hairline" />
        <span className="pointer-events-none absolute -top-1.5 right-0 bg-background pl-1 text-mini leading-none text-muted-foreground tabular-nums">{max}</span>

        <div className="flex min-h-28 flex-1 items-end gap-0.5 border-b border-border" onMouseLeave={() => setActive(null)}>
          {series.map((day, i) => (
            <button
              key={day.date}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              aria-label={`${label(day.date, { weekday: 'long', day: 'numeric', month: 'long' })}: ${day.signIns} sign-ins, ${day.signUps} new accounts`}
              className="group relative flex h-full flex-1 cursor-default items-end justify-center outline-none"
            >
              <MotionDiv
                className={cn(
                  'w-full max-w-6 rounded-t-[3px] transition-colors group-focus-visible:ring-[3px] group-focus-visible:ring-ring/50',
                  day.signIns ? 'bg-brand-app' : 'bg-muted',
                  active !== null && active !== i && 'bg-brand-app/40'
                )}
                initial={reduce ? false : { height: 0 }}
                animate={{ height: day.signIns ? `${(day.signIns / max) * 100}%` : 2 }}
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 140, damping: 20, delay: i * 0.02 }}
              />
              {active === i && (
                <div
                  role="tooltip"
                  className={cn(
                    'pointer-events-none absolute bottom-full z-10 mb-1.5 w-max rounded-md border border-border bg-popover px-2 py-1 text-left text-xs shadow-md',
                    i < 3 ? 'left-0' : i > last - 3 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                  )}
                >
                  <p className="font-medium text-foreground">{label(day.date, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                  <p className="text-muted-foreground tabular-nums">
                    <span className="font-medium text-foreground">{day.signIns}</span> sign-ins · {day.signUps} new
                  </p>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-1.5 flex justify-between text-mini text-muted-foreground">
          <span>{series[0] ? label(series[0].date, { day: 'numeric', month: 'short' }) : ''}</span>
          <span>Today</span>
        </div>
      </div>

      <table className="sr-only">
        <caption>Daily sign-ins and new accounts, last 14 days</caption>
        <thead>
          <tr><th>Date</th><th>Sign-ins</th><th>New accounts</th></tr>
        </thead>
        <tbody>
          {series.map((d) => (
            <tr key={d.date}><td>{d.date}</td><td>{d.signIns}</td><td>{d.signUps}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
