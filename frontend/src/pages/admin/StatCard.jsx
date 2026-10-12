import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import CountUp from './CountUp';

/**
 * A row of KPIs in one bordered card, split by hairlines (the 1px gap shows the border colour),
 * so four numbers take one card's worth of chrome instead of four.
 */
export function StatGrid({ className, children }) {
  return (
    <div className={cn('grid gap-px overflow-hidden rounded-xl border border-border bg-border shadow-xs', className)}>
      {children}
    </div>
  );
}

/** One KPI cell. Numbers count up; strings (e.g. "320ms") render as-is. `trend` is a whole percent. */
export default function StatCard({ icon: Icon, label, value, note, trend }) {
  return (
    <div className="bg-background px-3.5 py-3">
      <div className="flex items-center justify-between gap-2 text-muted-foreground">
        <span className="truncate text-xs">{label}</span>
        <Icon className="size-3.5 shrink-0" />
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-semibold tracking-tight text-foreground tabular-nums">
          {typeof value === 'number' ? <CountUp value={value} /> : value}
        </span>
        {typeof trend === 'number' && (
          <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium tabular-nums', trend >= 0 ? 'text-success' : 'text-destructive')}>
            {trend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {trend > 0 ? '+' : ''}
            {trend}%
          </span>
        )}
      </div>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
