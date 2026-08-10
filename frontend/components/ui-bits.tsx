"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import clsx from "clsx";
import { useT } from "@/lib/i18n";
import { SITE_PHONE_PRIMARY_TEL } from "@/lib/constants";

export function PriceTag({ price, discountPrice, badge }: { price: number; discountPrice?: number; badge?: string }) {
  if (discountPrice && discountPrice < price) {
    return (
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-semibold text-brand-red">€{discountPrice.toFixed(2)}</span>
          <span className="text-sm text-ink-soft line-through">€{price.toFixed(2)}</span>
        </div>
        {badge && (
          <span className="mt-0.5 inline-block rounded-full bg-brand-red-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-red">
            {badge}
          </span>
        )}
      </div>
    );
  }
  return <span className="text-xl font-semibold text-ink">€{price.toFixed(2)}</span>;
}

export function CallForQuote({ size = "sm" }: { size?: "sm" | "xs" }) {
  const { t } = useT();
  return (
    <a
      href={`tel:${SITE_PHONE_PRIMARY_TEL}`}
      className={clsx(
        "inline-flex items-center gap-1 font-medium text-ink-soft hover:text-brand-red",
        size === "sm" ? "text-sm" : "text-xs"
      )}
    >
      <Phone size={size === "sm" ? 13 : 11} /> {t.common.callForQuote}
    </a>
  );
}

const stockClassNames = {
  IN_STOCK: "bg-success-light text-success",
  LOW_STOCK: "bg-amber-50 text-amber-600",
  OUT_OF_STOCK: "bg-surface-muted text-ink-soft",
  BACKORDER: "bg-blue-50 text-blue-600",
};

export function StockBadge({ status }: { status: keyof typeof stockClassNames }) {
  const { t } = useT();
  const stockLabels: Record<keyof typeof stockClassNames, string> = {
    IN_STOCK: t.common.inStock,
    LOW_STOCK: t.common.lowStock,
    OUT_OF_STOCK: t.common.outOfStock,
    BACKORDER: t.common.backorder,
  };
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", stockClassNames[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {stockLabels[status]}
    </span>
  );
}

export function PartCode({ children, label }: { children: string; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
      {label && <span>{label}:</span>}
      <span className="part-code rounded bg-surface-muted px-1.5 py-0.5 text-ink">{children}</span>
    </span>
  );
}
