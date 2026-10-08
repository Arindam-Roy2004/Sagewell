import * as React from "react"

import { cn } from "@/lib/utils"

// RoastForge textarea: same edge and focus treatment as Input.
function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full resize-none rounded-md border-2 border-input bg-background px-3 py-2 text-base text-foreground transition-[color,box-shadow,border-color] outline-none md:text-sm",
        "placeholder:text-muted-foreground",
        "focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--ring)_20%,transparent)]",
        "aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_3px_color-mix(in_oklab,var(--destructive)_18%,transparent)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea }
