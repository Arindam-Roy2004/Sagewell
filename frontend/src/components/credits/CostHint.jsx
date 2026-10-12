import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

/** One-line "this costs credits" note used under inputs that spend them. */
export default function CostHint({ children, className }) {
  return (
    <p className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
      <Zap className="size-3 shrink-0 fill-brand-app text-brand-app" strokeWidth={0} />
      <span>{children}</span>
    </p>
  );
}
