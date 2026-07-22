"use client";

import Link from "next/link";
import { Star, Lock } from "lucide-react";
import clsx from "clsx";

export function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={14}
            className={n <= Math.round(rating) ? "fill-brand-red text-brand-red" : "fill-surface-border text-surface-border"}
          />
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-ink-soft">({count})</span>}
    </div>
  );
}

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

export function SignInForPrice({ size = "sm" }: { size?: "sm" | "xs" }) {
  return (
    <Link
      href="/login"
      className={clsx(
        "inline-flex items-center gap-1 font-medium text-ink-soft hover:text-brand-red",
        size === "sm" ? "text-sm" : "text-xs"
      )}
    >
      <Lock size={size === "sm" ? 13 : 11} /> Sign in for price
    </Link>
  );
}

const stockConfig = {
  IN_STOCK: { label: "In stock", className: "bg-success-light text-success" },
  LOW_STOCK: { label: "Low stock", className: "bg-amber-50 text-amber-600" },
  OUT_OF_STOCK: { label: "Out of stock", className: "bg-surface-muted text-ink-soft" },
  BACKORDER: { label: "Backorder", className: "bg-blue-50 text-blue-600" },
};

export function StockBadge({ status }: { status: keyof typeof stockConfig }) {
  const cfg = stockConfig[status];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", cfg.className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {cfg.label}
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
