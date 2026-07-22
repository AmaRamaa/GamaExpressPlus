"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, Tag } from "lucide-react";
import { useStore } from "@/lib/store";
import { getEffectivePrice } from "@/lib/pricing";
import { PartCode, SignInForPrice } from "@/components/ui-bits";
import ProductVisual from "@/components/ProductVisual";

export default function CartPage() {
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
        <p className="font-display text-2xl font-bold text-ink">Your cart is empty</p>
        <p className="mt-2 text-sm text-ink-soft">Find the right parts for your vehicle and add them here.</p>
        <Link href="/products" className="mt-5 inline-block rounded-lg bg-brand-red px-5 py-3 text-sm font-semibold text-white hover:bg-brand-red-dark">
          Browse parts
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Your cart</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {cart.map((line) => (
            <div key={line.product.id} className="flex gap-4 rounded-xl border border-surface-border bg-surface p-4 shadow-soft">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                <ProductVisual categorySlug={line.product.categorySlug} variant="secondary" />
              </div>
              <div className="flex-1">
                <Link href={`/products/${line.product.slug}`} className="font-medium text-ink hover:text-brand-red">
                  {line.product.title}
                </Link>
                <div className="mt-1"><PartCode label="Part No.">{line.product.partNumber}</PartCode></div>
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
                    <SignInForPrice />
                  )}
                </div>
              </div>
              <button onClick={() => removeFromCart(line.product.id)} aria-label="Remove item" className="self-start text-ink-soft hover:text-brand-red">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="h-fit rounded-xl border border-surface-border bg-surface p-5 shadow-soft">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">Order summary</h2>

          {user ? (
            <>
              <div className="mb-4 flex gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-surface-border px-3 py-2">
                  <Tag size={14} className="text-ink-soft" />
                  <input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Promo code"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
                <button
                  onClick={() => setApplied(promoCode === "WELCOME10" ? promoCode : null)}
                  className="rounded-lg border border-surface-border px-3 py-2 text-sm font-medium hover:border-brand-red hover:text-brand-red"
                >
                  Apply
                </button>
              </div>
              {applied && <p className="mb-3 text-xs font-medium text-success">WELCOME10 applied — 10% off</p>}
              {user.discountPercent > 0 && (
                <p className="mb-3 text-xs font-medium text-brand-red">
                  {user.accountLabel || "Member"} pricing applied — {user.discountPercent}% off
                </p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-ink-soft"><span>Parts subtotal</span><span>€{subtotal.toFixed(2)}</span></div>
                {discount > 0 && <div className="flex justify-between text-success"><span>Promo discount</span><span>-€{discount.toFixed(2)}</span></div>}
              </div>
              <div className="mt-3 flex justify-between border-t border-surface-border pt-3 text-base font-semibold text-ink">
                <span>Estimated total</span><span>€{total.toFixed(2)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-soft">Shipping and final total are confirmed when you call.</p>
            </>
          ) : (
            <div className="rounded-lg bg-surface-muted p-4 text-center text-sm">
              <SignInForPrice />
              <p className="mt-1.5 text-xs text-ink-soft">to see pricing and totals for these parts.</p>
            </div>
          )}

          <Link
            href="/checkout"
            className="mt-5 block rounded-lg bg-brand-red py-3 text-center text-sm font-semibold text-white hover:bg-brand-red-dark"
          >
            Review & call to order
          </Link>
          <p className="mt-2 text-center text-xs text-ink-soft">We don't take payment online — orders are placed by phone</p>
        </div>
      </div>
    </div>
  );
}
