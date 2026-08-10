"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { Product } from "@/lib/types";
import { useStore } from "@/lib/store";
import { PartCode, StockBadge } from "./ui-bits";
import ProductVisual from "./ProductVisual";
import ProductPrice from "./ProductPrice";
import QuickviewModal from "./QuickviewModal";
import { useT } from "@/lib/i18n";
import clsx from "clsx";

export default function ProductCard({ product }: { product: Product }) {
  const addToCart = useStore((s) => s.addToCart);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const isWishlisted = useStore((s) => s.wishlist.includes(product.id));
  const [quickviewOpen, setQuickviewOpen] = useState(false);
  const { t } = useT();

  return (
    <div className="group relative flex flex-col rounded-xl border border-surface-border bg-surface p-4 shadow-soft transition-shadow hover:shadow-card">
      <button
        onClick={() => toggleWishlist(product.id)}
        aria-label={isWishlisted ? t.common.removeFromFavorites : t.common.saveToFavorites}
        className="absolute right-3 top-3 z-10 rounded-full bg-surface/90 p-2 shadow-soft transition-colors hover:bg-surface"
      >
        <Heart size={16} className={clsx(isWishlisted ? "fill-brand-red text-brand-red" : "text-ink-soft")} />
      </button>

      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative mb-3 aspect-square overflow-hidden rounded-lg">
          <ProductVisual categorySlug={product.categorySlug} imageUrl={product.imageUrl} className="transition-transform duration-300 group-hover:scale-105" />

          {/* Hover overlay: quickview, matching Riardi's on-hover product actions */}
          <button
            onClick={(e) => { e.preventDefault(); setQuickviewOpen(true); }}
            className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-1.5 bg-ink/85 py-2.5 text-xs font-semibold text-white opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
          >
            <Eye size={14} /> {t.common.quickview}
          </button>
        </div>
      </Link>

      {quickviewOpen && <QuickviewModal product={product} onClose={() => setQuickviewOpen(false)} />}

      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">{product.brand.name}</span>
        <StockBadge status={product.stockStatus} />
      </div>

      <Link href={`/products/${product.slug}`}>
        <h3 className="mb-1.5 line-clamp-2 font-display text-base font-semibold leading-snug text-ink hover:text-brand-red">
          {product.title}
        </h3>
      </Link>

      <div className="mb-2">
        <PartCode label="Part No.">{product.partNumber}</PartCode>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <ProductPrice product={product} />
        <button
          onClick={() => addToCart(product)}
          disabled={product.stockStatus === "OUT_OF_STOCK"}
          aria-label={t.common.addToCart}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-red text-white transition-colors hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:bg-surface-border"
        >
          <ShoppingCart size={16} />
        </button>
      </div>
    </div>
  );
}
