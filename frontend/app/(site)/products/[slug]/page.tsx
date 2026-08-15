"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Heart, ShoppingCart, Truck, ShieldCheck, Minus, Plus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { mapProduct } from "@/lib/adapters";
import { useStore } from "@/lib/store";
import { PartCode, StockBadge } from "@/components/ui-bits";
import ProductCard from "@/components/ProductCard";
import ProductPrice from "@/components/ProductPrice";
import ProductVisual from "@/components/ProductVisual";
import type { Product } from "@/lib/types";

const tabs = ["Overview", "Specifications", "Compatible vehicles"] as const;

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const addToCart = useStore((s) => s.addToCart);
  const toggleWishlist = useStore((s) => s.toggleWishlist);

  const [product, setProduct] = useState<Product | null>(null);
  const isWishlisted = useStore((s) => s.wishlist.includes(product?.id ?? ""));
  const [related, setRelated] = useState<Product[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setProduct(null);
    setNotFound(false);
    setActiveImageIndex(0);
    api
      .get<any>(`/products/${slug}`)
      .then((raw) => {
        const p = mapProduct(raw);
        setProduct(p);
        return api.get<{ items: any[] }>(`/products?category=${p.categorySlug}&limit=5`);
      })
      .then((res) => {
        if (!res) return;
        setRelated(res.items.map(mapProduct).filter((r) => r.slug !== slug).slice(0, 4));
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setNotFound(true);
      });
  }, [slug]);

  if (notFound) {
    return (
      <div className="container-page py-16 text-center">
        <p className="font-display text-xl font-semibold text-ink">Product not found</p>
        <Link href="/products" className="mt-3 inline-block text-sm text-brand-red hover:underline">Back to all parts</Link>
      </div>
    );
  }

  // A layout-matching skeleton instead of a bare "Loading…" line -- swapping
  // a tiny centered message for this whole two-column page was the single
  // biggest source of layout shift on this route (Poor CLS in Speed
  // Insights, worse on mobile where the fetch takes longer to resolve).
  if (!product) {
    return (
      <div className="container-page animate-pulse py-8">
        <div className="mb-6 h-4 w-48 rounded bg-surface-muted" />
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-3 aspect-square rounded-xl bg-surface-muted" />
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-16 shrink-0 rounded-lg bg-surface-muted" />
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-surface-muted" />
              <div className="h-5 w-20 rounded-full bg-surface-muted" />
            </div>
            <div className="mb-2 h-8 w-3/4 rounded bg-surface-muted" />
            <div className="my-4 flex gap-4">
              <div className="h-4 w-24 rounded bg-surface-muted" />
              <div className="h-4 w-24 rounded bg-surface-muted" />
            </div>
            <div className="mb-5 h-4 w-full rounded bg-surface-muted" />
            <div className="mb-5 h-40 rounded-xl bg-surface-muted" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 rounded-lg bg-surface-muted" />
              <div className="h-12 rounded-lg bg-surface-muted" />
            </div>
          </div>
        </div>
        <div className="mt-12 h-11 border-b border-surface-border" />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <nav className="mb-6 text-xs text-ink-soft">
        <Link href="/" className="hover:text-brand-red">Home</Link> /{" "}
        <Link href="/products" className="hover:text-brand-red">{product.categoryName}</Link> /{" "}
        <span className="text-ink">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative mb-3 aspect-square overflow-hidden rounded-xl">
            <ProductVisual
              categorySlug={product.categorySlug}
              imageUrl={product.imageUrls?.[activeImageIndex] ?? product.imageUrl}
              variant="primary"
              fit="contain"
              images={product.imageUrls}
              activeIndex={activeImageIndex}
              onIndexChange={setActiveImageIndex}
            />
          </div>
          {product.imageUrls && product.imageUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.imageUrls.map((url, i) => (
                <button
                  key={url + i}
                  type="button"
                  onClick={() => setActiveImageIndex(i)}
                  aria-label={`View photo ${i + 1}`}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    i === activeImageIndex ? "border-brand-red" : "border-transparent hover:border-surface-border"
                  }`}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-red">{product.brand.name}</span>
            <StockBadge status={product.stockStatus} />
          </div>
          <h1 className="mb-2 font-display text-3xl font-bold text-ink">{product.title}</h1>

          <div className="my-4 flex flex-wrap gap-x-6 gap-y-2">
            <PartCode label="SKU">{product.sku}</PartCode>
            <PartCode label="Part No.">{product.partNumber}</PartCode>
            {product.oemNumbers.map((oem) => <PartCode key={oem} label="OEM">{oem}</PartCode>)}
          </div>

          <p className="mb-5 text-sm leading-relaxed text-ink-soft">{product.shortDescription}</p>

          <div className="mb-5 rounded-xl border border-surface-border bg-surface p-5">
            <ProductPrice product={product} />
            <p className="mt-1 text-xs text-ink-soft">VAT included · Ships from Prishtinë warehouse</p>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center rounded-lg border border-surface-border">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-2.5 text-ink-soft hover:text-brand-red"><Minus size={14} /></button>
                <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)} className="p-2.5 text-ink-soft hover:text-brand-red"><Plus size={14} /></button>
              </div>
              <button
                onClick={() => addToCart(product, quantity)}
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
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-lg bg-surface-muted p-3">
              <Truck size={16} className="text-brand-red" /> Delivery in 1–3 business days
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-surface-muted p-3">
              <ShieldCheck size={16} className="text-brand-red" /> 24-month warranty
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12 border-b border-surface-border">
        <div className="flex gap-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${tab === t ? "border-brand-red text-brand-red" : "border-transparent text-ink-soft hover:text-ink"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="py-8">
        {tab === "Overview" && (
          <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-ink-soft">
            <p>{product.description}</p>
            {product.installationNotes && (
              <div>
                <p className="mb-1 font-semibold text-ink">Installation notes</p>
                <p>{product.installationNotes}</p>
              </div>
            )}
          </div>
        )}
        {tab === "Specifications" && (
          <div className="max-w-2xl divide-y divide-surface-border rounded-xl border border-surface-border bg-surface">
            {[
              ["Brand", product.brand.name],
              ["SKU", product.sku],
              ["Part number", product.partNumber],
              ["Category", product.categoryName],
              ["Technical info", product.technicalInfo || "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between px-4 py-3 text-sm">
                <span className="text-ink-soft">{label}</span>
                <span className="font-medium text-ink">{value}</span>
              </div>
            ))}
          </div>
        )}
        {tab === "Compatible vehicles" && (
          <div className="max-w-2xl">
            {product.compatibleEngineIds.length === 0 ? (
              <p className="text-sm text-ink-soft">Universal fitment — not vehicle-specific.</p>
            ) : (
              <p className="text-sm text-ink-soft">
                Verified compatible with {product.compatibleEngineIds.length} vehicle variant(s). Use the Vehicle Finder to confirm fitment for your specific car.
              </p>
            )}
            <Link href="/vehicle-finder" className="mt-3 inline-block text-sm font-medium text-brand-red hover:underline">
              Open Vehicle Finder →
            </Link>
          </div>
        )}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="border-t border-surface-border py-10">
          <h2 className="mb-5 font-display text-xl font-bold text-ink">Related products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
