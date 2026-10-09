import { memo, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// Aliased so the linter (no JSX member-expression rule) sees the import as used.
const MotionDiv = motion.div;

/** Centred 1280px column. Section containers add `border-divide border-x` for the side rails. */
export function Container({ as: Component = "div", className, children, ...props }) {
  return (
    <Component className={cn("max-w-7xl mx-auto", className)} {...props}>
      {children}
    </Component>
  );
}

/** Full-width 1px horizontal rule between sections. */
export function DivideX({ className }) {
  return <div className={cn("bg-divide h-[1px] w-full", className)} />;
}

/**
 * Corner marker. Sits on the container corners and lights up (brand colour, glow, round)
 * when the cursor comes within 100px of it.
 */
export function Dot({ top, left, right, bottom }) {
  const ref = useRef(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const onMove = (event) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      setNear(Math.hypot(dx, dy) <= 100);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <MotionDiv
      ref={ref}
      className={cn(
        "absolute z-10 h-2 w-2",
        top && "top-0 xl:-top-1",
        left && "left-0 xl:-left-2",
        right && "right-0 xl:-right-2",
        bottom && "bottom-0 xl:-bottom-1"
      )}
      animate={{
        backgroundColor: near ? "var(--color-brand)" : "var(--lp-ink)",
        boxShadow: near ? "0 0 20px var(--color-brand), 0 0 40px var(--color-brand)" : "0 0 0 transparent",
        scale: near ? 1.5 : 1,
        borderRadius: near ? "50%" : "0%",
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    />
  );
}

/** Text with a light band sweeping across it, repeating every few seconds. */
export const ShimmerText = memo(function ShimmerText({ children, className, duration = 2, spread = 2 }) {
  const dynamicSpread = useMemo(() => children.length * spread, [children, spread]);
  return (
    <motion.p
      className={cn(
        "relative inline-block bg-[length:250%_100%,auto] bg-clip-text",
        "text-transparent [--base-color:#a1a1aa] [--base-gradient-color:#000]",
        "[background-repeat:no-repeat,padding-box] [--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]",
        "dark:[--base-color:#71717a] dark:[--base-gradient-color:#ffffff] dark:[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]",
        className
      )}
      initial={{ backgroundPosition: "100% center" }}
      animate={{ backgroundPosition: "0% center" }}
      transition={{ repeat: Infinity, duration, ease: "linear", repeatDelay: 2 }}
      style={{
        "--spread": `${dynamicSpread}px`,
        backgroundImage: "var(--bg), linear-gradient(var(--base-color), var(--base-color))",
      }}
    >
      {children}
    </motion.p>
  );
});

/** Brand-coloured shimmering eyebrow above section headings. */
export function Badge({ text }) {
  return (
    <ShimmerText
      duration={1.2}
      className="text-sm font-normal [--base-color:var(--color-brand)] [--base-gradient-color:var(--color-white)] dark:[--base-color:var(--color-brand)] dark:[--base-gradient-color:var(--color-white)]"
    >
      {text}
    </ShimmerText>
  );
}

export function SectionHeading({ children, className }) {
  return (
    <h2
      className={cn(
        "text-charcoal-700 text-center text-2xl font-medium tracking-tight md:text-3xl lg:text-4xl dark:text-neutral-100",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function SubHeading({ children, className, as: Component = "h2" }) {
  return (
    <Component
      className={cn(
        "text-center text-sm font-medium tracking-tight text-gray-600 md:text-sm lg:text-base dark:text-gray-300",
        className
      )}
    >
      {children}
    </Component>
  );
}

const BUTTON_VARIANTS = {
  primary: "bg-charcoal-900 text-white dark:bg-white dark:text-black",
  secondary:
    "border-divide border bg-white text-black transition duration-200 hover:bg-gray-300 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800",
};

/** Pill-ish button. Pass `to` for an in-app route, `href` for a link, neither for a <button>. */
export function Button({ variant = "primary", to, href, className, children, ...props }) {
  const classes = cn(
    "block rounded-xl px-6 py-2 text-center text-sm font-medium transition duration-150 active:scale-[0.98] sm:text-base cursor-pointer",
    BUTTON_VARIANTS[variant],
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

/** Hatched backdrop used behind cards and the hero frame. */
export function Scale({ className }) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 m-auto h-full w-full rounded-lg border border-(--pattern-fg) bg-white bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed dark:bg-neutral-900",
        className
      )}
    />
  );
}

/** 48px bordered tile holding a logo/icon. */
export function IconBlock({ icon, className, children }) {
  return (
    <div
      className={cn(
        "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-white shadow-md dark:border-neutral-600 dark:bg-neutral-900",
        className
      )}
    >
      {icon}
      {children}
    </div>
  );
}

/**
 * Canvas that fills with random pixels over `duration` ms, then sits at that state.
 * Colours are CSS values (var(...) allowed); they are resolved through the DOM so canvas can use them.
 */
export function PixelatedCanvas({
  isActive,
  className,
  size = 4,
  duration = 2500,
  fillColor = "var(--color-brand, #f17463)",
  backgroundColor = "var(--color-gray-200, white)",
}) {
  const canvasRef = useRef(null);
  const [filled, setFilled] = useState(() => new Set());
  const [dims, setDims] = useState({ width: 0, height: 0 });

  const resolveColor = (value) => {
    const el = document.createElement("div");
    el.style.color = value;
    document.body.appendChild(el);
    const resolved = window.getComputedStyle(el).color;
    document.body.removeChild(el);
    return resolved;
  };

  useEffect(() => {
    const measure = () => {
      const parent = canvasRef.current?.parentElement;
      if (parent) setDims({ width: parent.clientWidth, height: parent.clientHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!isActive) {
      setFilled(new Set());
      return;
    }
    if (!canvasRef.current || dims.width === 0 || dims.height === 0) return;
    const total = Math.floor(dims.width / size) * Math.floor(dims.height / size);
    if (total === 0) return;
    const order = Array.from({ length: total }, (_, i) => i).sort(() => Math.random() - 0.5);
    const startedAt = Date.now();
    let frame;
    const tick = () => {
      const progress = Math.min((Date.now() - startedAt) / duration, 1);
      const count = Math.floor(progress * order.length);
      const next = new Set();
      for (let i = 0; i < count; i++) next.add(order[i]);
      setFilled(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => frame && cancelAnimationFrame(frame);
  }, [isActive, dims, size, duration]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dims.width === 0 || dims.height === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (canvas.width !== dims.width || canvas.height !== dims.height) {
      canvas.width = dims.width;
      canvas.height = dims.height;
    }
    const cols = Math.floor(dims.width / size);
    const rows = Math.floor(dims.height / size);
    ctx.fillStyle = resolveColor(backgroundColor);
    ctx.fillRect(0, 0, dims.width, dims.height);
    ctx.fillStyle = resolveColor(fillColor);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (filled.has(y * cols + x)) ctx.fillRect(x * size, y * size, size, size);
      }
    }
  }, [filled, dims, fillColor, backgroundColor, size]);

  return <canvas ref={canvasRef} className={cn("h-full w-full", className)} style={{ imageRendering: "pixelated" }} />;
}
