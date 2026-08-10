"use client";

import { X, ShoppingCart, Heart } from "lucide-react";
import Link from "next/link";
import { Product } from "@/lib/types";
import { useStore } from "@/lib/store";
import { PartCode, StockBadge } from "./ui-bits";
import ProductVisual from "./ProductVisual";
import ProductPrice from "./ProductPrice";

export default function QuickviewModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const addToCart = useStore((s) => s.addToCart);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const isWishlisted = useStore((s) => s.wishlist.includes(product.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative grid w-full max-w-2xl gap-6 rounded-xl bg-surface p-6 shadow-lifted sm:grid-cols-2"
      >
        <button
          onClick={onClose}
          aria-label="Close quickview"
          className="absolute right-4 top-4 rounded-full p-1.5 text-ink-soft hover:bg-surface-muted hover:text-brand-red"
        >
          <X size={18} />
        </button>

        <div className="aspect-square overflow-hidden rounded-lg">
          <ProductVisual categorySlug={product.categorySlug} imageUrl={product.imageUrl} />
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-red">{product.brand.name}</span>
          <h3 className="mt-1 font-display text-xl font-bold text-ink">{product.title}</h3>
          <div className="mt-2"><PartCode label="Part No.">{product.partNumber}</PartCode></div>
          <p className="mt-3 text-sm text-ink-soft">{product.shortDescription}</p>

          <div className="mt-4 flex items-center justify-between">
            <ProductPrice product={product} />
            <StockBadge status={product.stockStatus} />
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => { addToCart(product); onClose(); }}
              disabled={product.stockStatus === "OUT_OF_STOCK"}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-red py-2.5 text-sm font-semibold text-white hover:bg-brand-red-dark disabled:bg-surface-border disabled:text-ink-soft"
            >
              <ShoppingCart size={16} /> Add to cart
            </button>
            <button
              onClick={() => toggleWishlist(product.id)}
              aria-label="Save to favorites"
              className="rounded-lg border border-surface-border p-2.5 hover:border-brand-red"
            >
              <Heart size={18} className={isWishlisted ? "fill-brand-red text-brand-red" : "text-ink-soft"} />
            </button>
          </div>

          <Link href={`/products/${product.slug}`} onClick={onClose} className="mt-3 text-center text-xs font-medium text-brand-red hover:underline">
            View full details →
          </Link>
        </div>
      </div>
    </div>
  );
}
