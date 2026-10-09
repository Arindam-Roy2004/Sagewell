import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

// Thin shadcn-style wrappers over Radix DropdownMenu.
// Radix renders the menu in a portal (on <body>), so it is never clipped by a parent's
// overflow and always sits above other content — fixing the old "dropdown not visible /
// not clickable" problem. It also handles focus, Escape, and outside-click for free.

// Non-modal by default. Several menu items open a confirm dialog; when a MODAL menu closes
// at the same moment a modal dialog opens, Radix can leave `pointer-events: none` on
// <body>, freezing every button on the page until a reload. A non-modal menu never locks
// the page, so that can't happen. Pass modal={true} to opt back in where needed.
const DropdownMenu = ({ modal = false, ...props }) => (
  <DropdownMenuPrimitive.Root modal={modal} {...props} />
);
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuContent = React.forwardRef(
  ({ className, sideOffset = 4, align = "end", ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-[100] min-w-[9rem] overflow-hidden rounded-lg border border-popover-border bg-popover p-1 text-popover-foreground shadow-md",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
);
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-[13px] outline-none transition-colors [&_svg]:size-3.5 [&_svg]:text-muted-foreground",
      "focus:bg-muted focus:text-foreground focus:[&_svg]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-hairline", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
