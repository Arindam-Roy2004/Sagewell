import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

function AccordionItem({ className, ...props }) {
  return <AccordionPrimitive.Item data-slot="accordion-item" className={cn("border-b border-hairline", className)} {...props} />
}

function AccordionTrigger({ className, children, ...props }) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group flex flex-1 items-center justify-between gap-4 py-5 text-left text-[15px] font-medium text-foreground outline-none transition-colors hover:text-primary-strong focus-visible:text-primary-strong cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-hairline bg-card shadow-2xs transition-transform duration-200 group-data-[state=open]:rotate-180">
          <ChevronDown className="size-4" />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({ className, children, ...props }) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-sm text-muted-foreground data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("pb-5 pr-12 leading-relaxed", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
