"use client";

import { useState } from "react";
import { PackageSearch } from "lucide-react";

export default function RequestPartPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 text-center">
          <PackageSearch size={28} className="mx-auto mb-3 text-brand-red" />
          <h1 className="font-display text-2xl font-bold text-ink">Request a part</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Can't find what you need in our catalog? Describe the part and vehicle, and our sourcing team will follow up by email.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-success/30 bg-success-light p-6 text-center">
            <p className="font-semibold text-success">Request received</p>
            <p className="mt-1 text-sm text-ink-soft">We'll email you within 1–2 business days with sourcing options.</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
            className="space-y-4 rounded-xl border border-surface-border bg-surface p-6 shadow-soft"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Full name</label>
                <input required className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Email</label>
                <input required type="email" className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Phone (optional)</label>
              <input className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Vehicle (make, model, year, variant)</label>
              <input placeholder="e.g. VW Golf Mk7 2015, Hatchback" className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">OEM number (if known)</label>
              <input className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Part description</label>
              <textarea required rows={4} className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-brand-red py-3 text-sm font-semibold text-white hover:bg-brand-red-dark">
              Submit request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
