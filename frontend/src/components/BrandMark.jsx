import { useRef } from "react";
import LeafIcon from "./icons/leaf-icon";
import { cn } from "@/lib/utils";

/**
 * Sagewell brand lockup: a teal tile with the animated leaf, plus the wordmark.
 * The leaf sways when the whole lockup is hovered.
 *
 * @param {"sm"|"md"|"lg"|"xl"} size
 * @param {boolean} showWordmark
 */
const SIZES = {
  sm: { tile: "size-6 rounded-[6px]", icon: 14, text: "text-base" },
  md: { tile: "size-7 rounded-[7px]", icon: 16, text: "text-lg" },
  lg: { tile: "size-9 rounded-lg", icon: 20, text: "text-xl" },
  xl: { tile: "size-14 rounded-xl", icon: 30, text: "text-2xl" },
};

export default function BrandMark({ size = "md", showWordmark = true, className, wordmarkClassName }) {
  const iconRef = useRef(null);
  const s = SIZES[size] || SIZES.md;

  return (
    <span
      className={cn("inline-flex items-center gap-2 select-none", className)}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
    >
      <span className={cn("inline-flex shrink-0 items-center justify-center bg-primary text-white shadow-2xs", s.tile)}>
        <LeafIcon ref={iconRef} size={s.icon} strokeWidth={2.25} />
      </span>
      {showWordmark && (
        <span className={cn("font-medium tracking-tight text-foreground", s.text, wordmarkClassName)}>Sagewell</span>
      )}
    </span>
  );
}
