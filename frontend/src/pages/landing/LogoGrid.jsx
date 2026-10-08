import { cn } from "@/lib/utils";
import { Reveal } from "./primitives";

/** 4×2 bordered grid of muted "logos" (icon + label, or a text wordmark). */
export default function LogoGrid({ items, className }) {
  return (
    <div className={cn("grid grid-cols-2 border-t border-lp-line md:grid-cols-4", className)}>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <Reveal
            key={item.label}
            delay={(i % 4) * 0.05}
            className={cn(
              "group flex h-28 items-center justify-center gap-2.5 border-lp-line px-4 md:h-32",
              "border-b",
              i % 2 === 0 ? "border-r" : "md:border-r",
              (i + 1) % 4 === 0 && "md:border-r-0",
              i >= items.length - 4 && "md:border-b-0",
              i >= items.length - 2 && "border-b-0"
            )}
          >
            {Icon && <Icon className="size-6 text-lp-text transition-colors group-hover:text-lp-heading" strokeWidth={1.75} />}
            <span
              className={cn(
                "transition-colors group-hover:text-lp-heading",
                Icon ? "text-[15px] text-lp-text" : "font-display text-xl font-semibold tracking-tight text-lp-text"
              )}
            >
              {item.label}
            </span>
          </Reveal>
        );
      })}
    </div>
  );
}
