import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "./button"

/**
 * Confirmation dialog (shadcn AlertDialog pattern), used before destructive actions.
 *
 * <ConfirmDialog open={open} onOpenChange={setOpen} title="Delete dialogue?"
 *   description="This can't be undone." confirmLabel="Delete" destructive onConfirm={fn} />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <AlertDialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-[121] grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-lg outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          )}
        >
          <div className="flex flex-col gap-2">
            <AlertDialog.Title className="text-lg font-semibold tracking-tight">{title}</AlertDialog.Title>
            {description && (
              <AlertDialog.Description className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </AlertDialog.Description>
            )}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel className={buttonVariants({ variant: "outline" })} disabled={loading}>
              {cancelLabel}
            </AlertDialog.Cancel>
            <AlertDialog.Action
              className={buttonVariants({ variant: destructive ? "destructive" : "default" })}
              disabled={loading}
              onClick={(e) => {
                // Keep the dialog open while an async action runs; the caller closes it.
                if (onConfirm) {
                  e.preventDefault()
                  onConfirm()
                }
              }}
            >
              {loading && <Loader2 className="animate-spin" />}
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

export default ConfirmDialog
