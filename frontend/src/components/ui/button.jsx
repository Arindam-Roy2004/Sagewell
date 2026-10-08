import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

// RoastForge button: uppercase mono label, 1px ink edge, soft lift on hover.
// `font="sans"` gives a sentence-case label (used on the marketing page).
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-border bg-card text-foreground shadow-2xs transition duration-200 cursor-pointer select-none outline-none shrink-0 hover:-translate-y-px hover:shadow-xs active:translate-y-0 active:shadow-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:stroke-2 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        ink: "bg-foreground text-background border-foreground hover:bg-foreground/90",
        destructive: "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90",
        outline: "bg-background hover:bg-muted",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Kept for existing call sites; same look as the primary button.
        accent: "bg-primary text-primary-foreground hover:bg-primary/90",
        ghost: "border-transparent bg-transparent shadow-none hover:bg-muted hover:shadow-none hover:translate-y-0",
        link: "border-transparent bg-transparent shadow-none text-primary-strong underline-offset-4 hover:underline hover:shadow-none hover:translate-y-0",
      },
      size: {
        default: "h-10 px-4",
        xs: "h-7 gap-1.5 px-2.5",
        sm: "h-9 gap-1.5 px-3",
        lg: "h-11 px-6",
        icon: "size-9 px-0",
        "icon-sm": "size-8 px-0",
        "icon-xs": "size-7 px-0",
      },
      font: {
        mono: "label-mono",
        sans: "font-sans text-sm font-medium normal-case tracking-normal",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      font: "mono",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  font = "mono",
  asChild = false,
  ...props
}) {
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
