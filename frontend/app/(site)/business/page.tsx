"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Percent, FileText, MapPin, CheckCircle2 } from "lucide-react";
import { SITE_LOCATIONS, SITE_EMAIL } from "@/lib/constants";
import { useT } from "@/lib/i18n";
import { buildMailtoUrl } from "@/lib/mailto";

export default function BusinessPage() {
  const { t } = useT();
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const companyName = form.get("companyName") as string;
    const contactName = form.get("contactName") as string;
    const email = form.get("email") as string;
    const phone = form.get("phone") as string;
    const volume = form.get("volume") as string;
    const partsNeeded = form.get("partsNeeded") as string;

    window.location.href = buildMailtoUrl(SITE_EMAIL, `[Bulk Quote Request] ${companyName}`, [
      ["Company", companyName],
      ["Contact name", contactName],
      ["Email", email],
      ["Phone", phone],
      ["Estimated monthly volume", volume],
      ["Parts needed", partsNeeded],
    ]);
    setSubmitted(true);
  }

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <Building2 size={28} className="mx-auto mb-3 text-brand-red" />
        <h1 className="font-display text-3xl font-bold text-ink">{t.business.title}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {t.business.subtitle}
        </p>
      </div>

      {/* Wholesale */}
      <section id="wholesale" className="mx-auto mt-14 max-w-3xl scroll-mt-24">
        <div className="mb-4 flex items-center gap-2">
          <Percent size={18} className="text-brand-red" />
          <h2 className="font-display text-xl font-bold text-ink">{t.business.wholesaleTitle}</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {t.business.wholesaleBenefits.map((b) => (
            <div key={b} className="flex items-start gap-2.5 rounded-xl border border-surface-border bg-surface p-4 shadow-soft">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />
              <p className="text-sm text-ink-soft">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bulk quote request */}
      <section id="quote" className="mx-auto mt-14 max-w-3xl scroll-mt-24">
        <div className="mb-4 flex items-center gap-2">
          <FileText size={18} className="text-brand-red" />
          <h2 className="font-display text-xl font-bold text-ink">{t.business.quoteTitle}</h2>
        </div>
        {submitted ? (
          <div className="rounded-xl border border-success/30 bg-success-light p-6 text-center">
            <p className="font-semibold text-success">{t.business.quoteSubmittedTitle}</p>
            <p className="mt-1 text-sm text-ink-soft">{t.business.quoteSubmittedDesc}</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-surface-border bg-surface p-6 shadow-soft"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{t.business.companyNameLabel}</label>
                <input name="companyName" required className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{t.business.contactNameLabel}</label>
                <input name="contactName" required className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{t.business.emailLabel}</label>
                <input name="email" required type="email" className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{t.business.phoneLabel}</label>
                <input name="phone" className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">{t.business.volumeLabel}</label>
              <select name="volume" className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm text-ink" defaultValue="">
                <option value="" disabled>{t.business.selectRangePlaceholder}</option>
                <option>{t.business.volumeUnder1k}</option>
                <option>{t.business.volume1kTo5k}</option>
                <option>{t.business.volume5kTo20k}</option>
                <option>{t.business.volumeOver20k}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">{t.business.partsNeededLabel}</label>
              <textarea name="partsNeeded" required rows={4} placeholder={t.business.partsNeededPlaceholder} className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-red py-3 text-sm font-semibold text-white hover:bg-brand-red-dark"
            >
              {t.business.submitQuoteButton}
            </button>
          </form>
        )}
      </section>

      {/* Invoicing */}
      <section id="invoicing" className="mx-auto mt-14 max-w-3xl scroll-mt-24">
        <div className="mb-4 flex items-center gap-2">
          <FileText size={18} className="text-brand-red" />
          <h2 className="font-display text-xl font-bold text-ink">{t.business.invoicingTitle}</h2>
        </div>
        <div className="rounded-xl border border-surface-border bg-surface p-5 shadow-soft">
          <p className="text-sm leading-relaxed text-ink-soft">
            {t.business.invoicingDesc}<Link href="/contact" className="font-medium text-brand-red hover:underline">{t.business.invoicingContactLink}</Link>{t.business.invoicingDescEnd}
          </p>
        </div>
      </section>

      {/* Branch locations */}
      <section id="locations" className="mx-auto mt-14 max-w-3xl scroll-mt-24">
        <div className="mb-4 flex items-center gap-2">
          <MapPin size={18} className="text-brand-red" />
          <h2 className="font-display text-xl font-bold text-ink">{t.business.locationsTitle}</h2>
        </div>
        <div className="space-y-3">
          {SITE_LOCATIONS.map((loc) => (
            <a
              key={loc.label}
              href={loc.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface p-4 shadow-soft hover:border-brand-red"
            >
              <div>
                <p className="font-semibold text-ink">{loc.label}</p>
                <p className="text-xs text-ink-soft">{t.business.locationsHours}</p>
              </div>
              <span className="rounded-full bg-success-light px-2.5 py-1 text-xs font-medium text-success">{t.business.getDirections}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
