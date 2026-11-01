import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

// shadcn (new-york) button on the neutral palette. Filled variants paint a
// layered "surface" (gradient body, edge highlight, ring, soft drop) on a
// ::before so presses can scale it without moving the label; see .t-surface in
// index.css. `font="mono"` keeps the old uppercase mono label for the few
// places that want it.
const buttonVariants = cva(
  "relative isolate inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-clip-padding text-sm font-medium transition-[color,box-shadow] cursor-pointer select-none shrink-0 outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "t-surface t-surface-primary text-primary-foreground",
        brand: "t-surface t-surface-brand text-white",
        destructive: "t-surface t-surface-destructive text-white focus-visible:ring-destructive/30",
        outline: "t-surface t-surface-outline text-foreground",
        secondary: "t-surface t-surface-secondary text-secondary-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/60",
        link: "text-primary underline-offset-4 hover:underline",
        // Older names kept for existing call sites.
        ink: "t-surface t-surface-primary text-primary-foreground",
        accent: "t-surface t-surface-primary text-primary-foreground",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-7 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-xs": "size-7 rounded-md",
      },
      font: {
        sans: "",
        mono: "label-mono",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      font: "sans",
    },
  }
)

function Button({ className, variant = "default", size = "default", font = "sans", asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant || "default"}
      className={cn(buttonVariants({ variant, size, font, className }))}
      {...props}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }
