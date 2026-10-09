import { Loader2, CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSourceMeta } from "./source-meta";

/** Rounded tile with the source-type icon. */
export function SourceIcon({ type, className, iconClassName }) {
  const { Icon, tone } = getSourceMeta(type);
  return (
    <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-md", tone, className)}>
      <Icon className={cn("size-4", iconClassName)} />
    </span>
  );
}

/** Compact processing status: spinner while working, red when failed, nothing when ready. */
export function SourceStatus({ status, showReady = false, className }) {
  if (["uploading", "queued", "processing"].includes(status)) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
        <Loader2 className="size-3 animate-spin" />
        {status === "queued" ? "Queued" : status === "uploading" ? "Uploading" : "Processing"}
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs text-destructive", className)}>
        <CircleAlert className="size-3" /> Failed
      </span>
    );
  }
  if (showReady) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs text-success", className)}>
        <CircleCheck className="size-3" /> Ready
      </span>
    );
  }
  return null;
}
