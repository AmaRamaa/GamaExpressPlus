import { forwardRef, type LabelHTMLAttributes } from "react";
import { Label as LabelPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <LabelPrimitive.Root
      ref={ref}
      className={cn("mb-1 block text-xs font-medium text-ink-soft", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";
