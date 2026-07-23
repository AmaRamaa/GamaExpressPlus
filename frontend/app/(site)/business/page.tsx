"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Percent, FileText, MapPin, CheckCircle2 } from "lucide-react";

const wholesaleBenefits = [
  "Tiered pricing based on monthly order volume",
  "Dedicated account manager for sourcing and order issues",
  "Priority stock allocation on high-demand parts",
  "Net-30 invoicing for approved accounts",
];

const branches = [
  { name: "Prishtinë Central", address: "Rr. Bill Clinton, Prishtinë", hours: "Mon–Sat, 08:00–18:00", pickup: true },
  { name: "Prizren Branch", address: "Rr. Nëna Terezë, Prizren", hours: "Mon–Sat, 09:00–17:00", pickup: true },
  { name: "Gjilan Branch", address: "Rr. Bulevardi i Pavarësisë, Gjilan", hours: "Mon–Fri, 09:00–17:00", pickup: false },
];

export default function BusinessPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <Building2 size={28} className="mx-auto mb-3 text-brand-red" />
        <h1 className="font-display text-3xl font-bold text-ink">Business & wholesale accounts</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Tiered pricing, invoicing, and bulk quotes for garages, body shops, and resellers across Kosovo.
        </p>
      </div>

      {/* Wholesale */}
      <section id="wholesale" className="mx-auto mt-14 max-w-3xl scroll-mt-24">
        <div className="mb-4 flex items-center gap-2">
          <Percent size={18} className="text-brand-red" />
          <h2 className="font-display text-xl font-bold text-ink">Wholesale accounts</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {wholesaleBenefits.map((b) => (
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
          <h2 className="font-display text-xl font-bold text-ink">Request a bulk quote</h2>
        </div>
        {submitted ? (
          <div className="rounded-xl border border-success/30 bg-success-light p-6 text-center">
            <p className="font-semibold text-success">Quote request received</p>
            <p className="mt-1 text-sm text-ink-soft">Our business team will follow up within 1–2 business days.</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
            className="space-y-4 rounded-xl border border-surface-border bg-surface p-6 shadow-soft"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Company name</label>
                <input required className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Contact name</label>
                <input required className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Email</label>
                <input required type="email" className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Phone</label>
                <input className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Estimated monthly order volume</label>
              <select className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm text-ink" defaultValue="">
                <option value="" disabled>Select a range</option>
                <option>Under €1,000</option>
                <option>€1,000 – €5,000</option>
                <option>€5,000 – €20,000</option>
                <option>Over €20,000</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Parts needed</label>
              <textarea required rows={4} placeholder="e.g. bumper covers and headlight assemblies for VW/Audi models" className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-brand-red py-3 text-sm font-semibold text-white hover:bg-brand-red-dark">
              Submit quote request
            </button>
          </form>
        )}
      </section>

      {/* Invoicing */}
      <section id="invoicing" className="mx-auto mt-14 max-w-3xl scroll-mt-24">
        <div className="mb-4 flex items-center gap-2">
          <FileText size={18} className="text-brand-red" />
          <h2 className="font-display text-xl font-bold text-ink">Invoicing</h2>
        </div>
        <div className="rounded-xl border border-surface-border bg-surface p-5 shadow-soft">
          <p className="text-sm leading-relaxed text-ink-soft">
            Approved business accounts can order on Net-30 terms with consolidated monthly VAT invoicing.
            Every invoice itemizes part numbers, OEM references, and order dates for easy reconciliation.
            Reach out via the quote form above or <Link href="/contact" className="font-medium text-brand-red hover:underline">contact us</Link> to
            set up invoicing for your account.
          </p>
        </div>
      </section>

      {/* Branch locations */}
      <section id="locations" className="mx-auto mt-14 max-w-3xl scroll-mt-24">
        <div className="mb-4 flex items-center gap-2">
          <MapPin size={18} className="text-brand-red" />
          <h2 className="font-display text-xl font-bold text-ink">Branch locations</h2>
        </div>
        <div className="space-y-3">
          {branches.map((b) => (
            <div key={b.name} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface p-4 shadow-soft">
              <div>
                <p className="font-semibold text-ink">{b.name}</p>
                <p className="text-xs text-ink-soft">{b.address} · {b.hours}</p>
              </div>
              {b.pickup && (
                <span className="rounded-full bg-success-light px-2.5 py-1 text-xs font-medium text-success">Pickup available</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
