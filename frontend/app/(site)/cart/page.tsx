"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, Tag } from "lucide-react";
import { useStore } from "@/lib/store";
import { getEffectivePrice } from "@/lib/pricing";
import { PartCode, CallForQuote } from "@/components/ui-bits";
import ProductVisual from "@/components/ProductVisual";
import { useT } from "@/lib/i18n";

export default function CartPage() {
  const { t } = useT();
  const cart = useStore((s) => s.cart);
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const user = useStore((s) => s.user);
  const [promoCode, setPromoCode] = useState("");
  const [applied, setApplied] = useState<string | null>(null);

  const subtotal = cart.reduce((sum, l) => sum + getEffectivePrice(l.product, user).finalPrice * l.quantity, 0);
  const discount = applied === "WELCOME10" ? subtotal * 0.1 : 0;
  const total = subtotal - discount;

  if (cart.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <p className="font-display text-2xl font-bold text-ink">{t.cart.emptyTitle}</p>
        <p className="mt-2 text-sm text-ink-soft">{t.cart.emptyDesc}</p>
        <Link href="/products" className="mt-5 inline-block rounded-lg bg-brand-red px-5 py-3 text-sm font-semibold text-white hover:bg-brand-red-dark">
          {t.cart.browseParts}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">{t.cart.title}</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {cart.map((line) => (
            <div key={line.product.id} className="flex gap-4 rounded-xl border border-surface-border bg-surface p-4 shadow-soft">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                <ProductVisual categorySlug={line.product.categorySlug} imageUrl={line.product.imageUrl} variant="secondary" />
              </div>
              <div className="flex-1">
                <Link href={`/products/${line.product.slug}`} className="font-medium text-ink hover:text-brand-red">
                  {line.product.title}
                </Link>
                <div className="mt-1"><PartCode label={t.cart.partNoLabel}>{line.product.partNumber}</PartCode></div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-surface-border">
                    <button onClick={() => updateQuantity(line.product.id, line.quantity - 1)} className="p-2 text-ink-soft hover:text-brand-red"><Minus size={13} /></button>
                    <span className="w-7 text-center text-sm">{line.quantity}</span>
                    <button onClick={() => updateQuantity(line.product.id, line.quantity + 1)} className="p-2 text-ink-soft hover:text-brand-red"><Plus size={13} /></button>
                  </div>
                  {user ? (
                    <span className="font-semibold text-ink">
                      €{(getEffectivePrice(line.product, user).finalPrice * line.quantity).toFixed(2)}
                    </span>
                  ) : (
                    <CallForQuote />
                  )}
                </div>
              </div>
              <button onClick={() => removeFromCart(line.product.id)} aria-label={t.cart.removeItem} className="self-start text-ink-soft hover:text-brand-red">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="h-fit rounded-xl border border-surface-border bg-surface p-5 shadow-soft">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">{t.cart.orderSummary}</h2>

          {user ? (
            <>
              <div className="mb-4 flex gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-surface-border px-3 py-2">
                  <Tag size={14} className="text-ink-soft" />
                  <input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder={t.cart.promoCodePlaceholder}
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
                <button
                  onClick={() => setApplied(promoCode === "WELCOME10" ? promoCode : null)}
                  className="rounded-lg border border-surface-border px-3 py-2 text-sm font-medium hover:border-brand-red hover:text-brand-red"
                >
                  {t.cart.apply}
                </button>
              </div>
              {applied && <p className="mb-3 text-xs font-medium text-success">{t.cart.promoAppliedMessage}</p>}
              {user.discountPercent > 0 && (
                <p className="mb-3 text-xs font-medium text-brand-red">
                  {user.accountLabel || t.cart.memberFallback} {t.cart.pricingAppliedMiddle} {user.discountPercent}{t.cart.percentOff}
                </p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-ink-soft"><span>{t.cart.partsSubtotal}</span><span>€{subtotal.toFixed(2)}</span></div>
                {discount > 0 && <div className="flex justify-between text-success"><span>{t.cart.promoDiscount}</span><span>-€{discount.toFixed(2)}</span></div>}
              </div>
              <div className="mt-3 flex justify-between border-t border-surface-border pt-3 text-base font-semibold text-ink">
                <span>{t.cart.estimatedTotal}</span><span>€{total.toFixed(2)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-soft">{t.cart.shippingNote}</p>
            </>
          ) : (
            <div className="rounded-lg bg-surface-muted p-4 text-center text-sm">
              <CallForQuote />
              <p className="mt-1.5 text-xs text-ink-soft">{t.cart.guestPricingNote}</p>
            </div>
          )}

          <Link
            href="/checkout"
            className="mt-5 block rounded-lg bg-brand-red py-3 text-center text-sm font-semibold text-white hover:bg-brand-red-dark"
          >
            {t.cart.reviewCallToOrder}
          </Link>
          <p className="mt-2 text-center text-xs text-ink-soft">{t.cart.noOnlinePaymentNote}</p>
        </div>
      </div>
    </div>
  );
}
