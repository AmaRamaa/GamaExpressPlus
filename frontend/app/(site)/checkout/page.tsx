"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, MessageCircle, Copy, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { getEffectivePrice } from "@/lib/pricing";
import { CallForQuote } from "@/components/ui-bits";
import { SITE_PHONE_PRIMARY, SITE_PHONE_PRIMARY_TEL, SITE_WHATSAPP_URL } from "@/lib/constants";
import { useT } from "@/lib/i18n";

const PHONE_DISPLAY = SITE_PHONE_PRIMARY;
const PHONE_TEL = SITE_PHONE_PRIMARY_TEL;
const WHATSAPP_URL = SITE_WHATSAPP_URL;

export default function CheckoutPage() {
  const cart = useStore((s) => s.cart);
  const user = useStore((s) => s.user);
  const [copied, setCopied] = useState(false);
  const { t } = useT();

  const subtotal = cart.reduce((sum, l) => sum + getEffectivePrice(l.product, user).finalPrice * l.quantity, 0);

  const summaryText = user
    ? cart
        .map((l) => `${l.quantity}× ${l.product.title} (${l.product.partNumber}) — €${(getEffectivePrice(l.product, user).finalPrice * l.quantity).toFixed(2)}`)
        .join("\n") + `\n\nEstimated total: €${subtotal.toFixed(2)}`
    : cart.map((l) => `${l.quantity}× ${l.product.title} (${l.product.partNumber})`).join("\n");

  function copySummary() {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (cart.length === 0) {
    return (
      <div className="container-page py-16 text-center text-ink-soft">
        {t.checkout.emptyCart}
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="mb-2 font-display text-2xl font-bold text-ink">{t.checkout.pageTitle}</h1>
      <p className="mb-6 text-sm text-ink-soft">
        {t.checkout.pageDescription}
      </p>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-brand-red/30 bg-brand-red-light p-6 text-center">
          <Phone size={28} className="mx-auto mb-3 text-brand-red" />
          <p className="font-display text-xl font-bold text-ink">{t.checkout.callUsTitle}</p>
          <a href={`tel:${PHONE_TEL}`} className="mt-1 block font-display text-3xl font-bold text-brand-red hover:underline">
            {PHONE_DISPLAY}
          </a>
          <p className="mt-2 text-sm text-ink-soft">{t.checkout.hours}</p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={`tel:${PHONE_TEL}`}
              className="flex items-center justify-center gap-2 rounded-lg bg-brand-red px-5 py-3 text-sm font-semibold text-white hover:bg-brand-red-dark"
            >
              <Phone size={16} /> {t.checkout.callNowButton}
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-surface-border bg-surface px-5 py-3 text-sm font-semibold text-ink hover:border-brand-red hover:text-brand-red"
            >
              <MessageCircle size={16} /> {t.checkout.whatsappButton}
            </a>
          </div>

          <button
            onClick={copySummary}
            className="mx-auto mt-4 flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-brand-red"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? t.checkout.copiedMessage : t.checkout.copyListButton}
          </button>

          <p className="mt-5 text-xs text-ink-soft">
            {t.checkout.preferCallText} <Link href="/contact" className="font-medium text-brand-red hover:underline">{t.checkout.leaveNumberLink}</Link>{" "}
            {t.checkout.getBackText}
          </p>
        </div>

        <div className="h-fit rounded-xl border border-surface-border bg-surface p-5 shadow-soft">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">{t.checkout.orderListTitle}</h2>
          <div className="mb-4 max-h-64 space-y-3 overflow-y-auto">
            {cart.map((l) => (
              <div key={l.product.id} className="flex justify-between text-sm">
                <span className="text-ink-soft">{l.product.title} × {l.quantity}</span>
                {user ? (
                  <span className="font-medium text-ink">
                    €{(getEffectivePrice(l.product, user).finalPrice * l.quantity).toFixed(2)}
                  </span>
                ) : (
                  <CallForQuote size="xs" />
                )}
              </div>
            ))}
          </div>
          {user ? (
            <>
              {user.discountPercent > 0 && (
                <p className="mb-2 text-xs font-medium text-brand-red">
                  {user.accountLabel || t.checkout.memberFallback} {t.checkout.pricingAppliedLabel} — {user.discountPercent}{t.checkout.offSuffix}
                </p>
              )}
              <div className="flex justify-between border-t border-surface-border pt-3 text-base font-semibold text-ink">
                <span>{t.checkout.estimatedTotal}</span><span>€{subtotal.toFixed(2)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-soft">{t.checkout.finalPricingNote}</p>
            </>
          ) : (
            <p className="border-t border-surface-border pt-3 text-xs text-ink-soft">
              <Link href="/login" className="font-medium text-brand-red hover:underline">{t.checkout.signIn}</Link> {t.checkout.toSeePricingText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
