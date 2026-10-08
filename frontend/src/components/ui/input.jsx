import * as React from "react"

import { cn } from "@/lib/utils"

// RoastForge input: 2px ink edge, teal focus edge with a soft ring.
function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-md border-2 border-input bg-background px-3 py-1 text-base font-medium text-foreground transition-[color,box-shadow,border-color] outline-none md:text-sm",
        "placeholder:font-normal placeholder:text-muted-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--ring)_20%,transparent)]",
        "aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_3px_color-mix(in_oklab,var(--destructive)_18%,transparent)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input }
