"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const info = [
  { icon: MapPin, label: "Rr. Bill Clinton, Prishtinë, Kosovë" },
  { icon: Phone, label: "+383 44 000 000" },
  { icon: Mail, label: "hello@gamaexpress.com" },
  { icon: Clock, label: "Mon–Sat, 08:00–18:00" },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-bold text-ink">Contact us</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Questions about an order, fitment, or a wholesale account — we usually reply within one business day.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-8 sm:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          {info.map((i) => (
            <div key={i.label} className="flex items-start gap-3">
              <i.icon size={18} className="mt-0.5 shrink-0 text-brand-red" />
              <p className="text-sm text-ink-soft">{i.label}</p>
            </div>
          ))}
        </div>

        {submitted ? (
          <div className="rounded-xl border border-success/30 bg-success-light p-6 text-center">
            <p className="font-semibold text-success">Message sent</p>
            <p className="mt-1 text-sm text-ink-soft">We'll get back to you within one business day.</p>
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
              <label className="mb-1 block text-xs font-medium text-ink-soft">Subject</label>
              <input required className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Message</label>
              <textarea required rows={5} className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-brand-red py-3 text-sm font-semibold text-white hover:bg-brand-red-dark">
              Send message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
