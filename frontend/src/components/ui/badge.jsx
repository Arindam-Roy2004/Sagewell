import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

// RoastForge badge / chip.
const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2.5 text-xs font-medium [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border bg-background text-foreground",
        muted: "border-hairline bg-muted text-muted-foreground",
        brand: "border-transparent bg-primary/10 text-primary-strong",
        success: "border-transparent bg-success/12 text-success",
        warning: "border-transparent bg-warning/12 text-warning",
        destructive: "border-transparent bg-destructive/10 text-destructive",
      },
      size: {
        default: "h-6 px-2.5 text-xs",
        sm: "h-5 px-1.5 text-mini",
      },
    },
    defaultVariants: { variant: "outline", size: "default" },
  }
)

function Badge({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "span"
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant, size }), className)} {...props} />
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants }
