import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// Aliased so the linter (no JSX member-expression rule) sees the import as used.
const MotionDiv = motion.div;

/** Centred 1280px column with the thin vertical side rails that run the full page height. */
export function Rails({ className, children, ...props }) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl border-x border-lp-line", className)} {...props}>
      {children}
    </div>
  );
}

/** Full-width horizontal rule. With `markers`, small squares sit where it crosses the rails. */
export function Rule({ markers = false, className }) {
  return (
    <div className={cn("relative w-full border-t border-lp-divide", className)} aria-hidden="true">
      {markers && (
        <div className="relative mx-auto max-w-7xl">
          <span className="absolute -top-[4px] -left-[4px] size-[7px] bg-lp-heading" />
          <span className="absolute -top-[4px] -right-[4px] size-[7px] bg-lp-heading" />
        </div>
      )}
    </div>
  );
}

/** Fade + rise + un-blur when scrolled into view (runs once). */
export function Reveal({ delay = 0, y = 16, className, children, as = "div" }) {
  const Comp = as === "div" ? MotionDiv : motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1], delay }}
    >
      {children}
    </Comp>
  );
}

/** Eyebrow + heading + subtitle, centred, as used at the top of every section. */
export function SectionHeading({ eyebrow, title, subtitle, className, children }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-20 text-center md:px-8", className)}>
      {eyebrow && (
        <Reveal>
          <p className="text-sm text-brand">{eyebrow}</p>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2 className="mt-3 font-display text-3xl font-normal tracking-tight text-balance text-lp-heading md:text-4xl">{title}</h2>
      </Reveal>
      {subtitle && (
        <Reveal delay={0.1}>
          <p className="mx-auto mt-5 max-w-lg text-balance text-base leading-relaxed text-lp-text">{subtitle}</p>
        </Reveal>
      )}
      {children}
    </div>
  );
}

/** Mono uppercase band label ("SUPPORTED SOURCES"). */
export function BandLabel({ children, className }) {
  return (
    <p className={cn("py-10 text-center font-dm-mono text-sm uppercase tracking-wide text-lp-text", className)}>
      {children}
    </p>
  );
}

const BUTTON_STYLES = {
  ink: "bg-lp-ink text-lp-bg hover:opacity-90 shadow-[0_1px_2px_rgb(0_0_0/0.08)]",
  outline: "border border-lp-line bg-lp-bg text-lp-heading hover:bg-lp-soft shadow-[0_1px_2px_rgb(0_0_0/0.04)]",
  brand: "bg-brand text-white hover:opacity-90",
};

/** Landing-page button. Pass `to` for an in-app route or `href` for an external link. */
export function LpButton({ variant = "ink", to, href, className, children, ...props }) {
  const classes = cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-6 text-[15px] font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer",
    BUTTON_STYLES[variant],
    className
  );
  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  if (href) {
    const external = /^https?:/.test(href);
    return (
      <a href={href} className={classes} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...props}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}

/** Small outlined status chip used inside the mock UIs (blue "Connected", etc.). */
export function Chip({ tone = "blue", className, children }) {
  const tones = {
    blue: "border-blue-500/60 text-blue-600 bg-blue-50/60 dark:text-blue-400 dark:bg-blue-500/10",
    green: "border-emerald-500/60 text-emerald-600 bg-emerald-50/60 dark:text-emerald-400 dark:bg-emerald-500/10",
    red: "border-red-400/70 text-red-500 bg-red-50/60 dark:bg-red-500/10",
    amber: "border-amber-400/70 text-amber-600 bg-amber-50/60 dark:text-amber-400 dark:bg-amber-500/10",
    gray: "border-lp-line text-lp-text bg-lp-bg",
  };
  return (
    <span className={cn("inline-flex items-center rounded-[4px] border px-2 py-0.5 text-xs", tones[tone], className)}>
      {children}
    </span>
  );
}

/** Soft grey card with a brand icon (use cases, benefits). */
export function SoftCard({ icon: Icon, title, text, className = "" }) {
  return (
    <div className={cn("rounded-lg bg-lp-soft p-5 transition-colors hover:bg-lp-soft-2", className)}>
      <Icon className="size-[22px] text-brand" strokeWidth={1.75} />
      <h3 className="mt-4 font-landing text-[18px] font-normal tracking-normal text-black dark:text-white">{title}</h3>
      <p className="mt-2 text-[16px] leading-relaxed text-lp-text">{text}</p>
    </div>
  );
}
