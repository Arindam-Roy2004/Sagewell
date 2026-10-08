// Animated leaf icon, adapted from lucide-animated (https://lucide-animated.com, pqoqubbw/icons,
// MIT License, Copyright (c) 2024-2026 pqoqubbw). Lucide icon paths are ISC licensed.
// Follows the RoastForge animated-icon pattern: plays on hover, or is driven by a parent
// through the startAnimation / stopAnimation handle.
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { motion, useAnimation } from "motion/react";

import { cn } from "@/lib/utils";

// Aliased so the linter (which has no JSX member-expression rule) sees the import as used.
const MotionSvg = motion.svg;

const LEAF_VARIANTS = {
  normal: { rotate: 0, y: 0, x: 0 },
  animate: {
    rotate: [0, -8, 4, -3, 0],
    y: [0, -4, -2, -1, 0],
    x: [0, 2, -2, 1, 0],
    transition: { duration: 1.6, ease: "easeInOut" },
  },
};

const LeafIcon = forwardRef(
  ({ onMouseEnter, onMouseLeave, className, size = 24, strokeWidth = 2, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleMouseEnter = useCallback(
      (e) => {
        if (isControlledRef.current) onMouseEnter?.(e);
        else controls.start("animate");
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e) => {
        if (isControlledRef.current) onMouseLeave?.(e);
        else controls.start("normal");
      },
      [controls, onMouseLeave]
    );

    return (
      <div className={cn("inline-flex", className)} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
        <MotionSvg
          animate={controls}
          fill="none"
          height={size}
          width={size}
          initial="normal"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
          style={{ overflow: "visible" }}
          variants={LEAF_VARIANTS}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </MotionSvg>
      </div>
    );
  }
);

LeafIcon.displayName = "LeafIcon";

export default LeafIcon;
