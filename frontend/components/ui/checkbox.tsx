"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Checkbox = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "flex size-4 shrink-0 items-center justify-center rounded border border-slate-300 bg-white outline-none data-[state=checked]:border-brand-red data-[state=checked]:bg-brand-red disabled:cursor-not-allowed disabled:opacity-60",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="text-white">
      <Check size={12} strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";
