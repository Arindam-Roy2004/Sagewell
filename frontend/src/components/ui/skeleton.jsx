import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md border border-hairline bg-muted/60", className)}
      {...props}
    />
  )
}

export { Skeleton }
