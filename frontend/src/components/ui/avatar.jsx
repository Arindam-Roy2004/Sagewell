import { useState } from "react"
import { cn } from "@/lib/utils"

/** Round avatar: the image when it loads, otherwise the person's initials. */
export function Avatar({ src, name = "", className }) {
  const [failed, setFailed] = useState(false)
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "?"

  return (
    <span
      className={cn(
        "relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-foreground",
        className
      )}
    >
      {src && !failed ? (
        <img src={src} alt="" referrerPolicy="no-referrer" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        initials
      )}
    </span>
  )
}

/** Small keyboard-shortcut hint, e.g. <Kbd>⌘K</Kbd>. */
export function Kbd({ className, children }) {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 select-none items-center justify-center gap-0.5 rounded border border-border bg-muted px-1 font-sans text-[11px] font-medium text-muted-foreground",
        className
      )}
    >
      {children}
    </kbd>
  )
}

export default Avatar
