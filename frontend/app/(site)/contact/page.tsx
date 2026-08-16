"use client";

import { useState } from "react";
import { Mail, Phone, Clock, MapPin } from "lucide-react";
import { SITE_PHONE_PRIMARY, SITE_PHONE_SECONDARY, SITE_EMAIL, SITE_LOCATIONS } from "@/lib/constants";
import { useT } from "@/lib/i18n";
import { buildMailtoUrl } from "@/lib/mailto";

export default function ContactPage() {
  const { t } = useT();
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fullName = form.get("fullName") as string;
    const email = form.get("email") as string;
    const subject = form.get("subject") as string;
    const message = form.get("message") as string;

    window.location.href = buildMailtoUrl(SITE_EMAIL, `[Contact] ${subject}`, [
      ["Name", fullName],
      ["Email", email],
      ["Message", message],
    ]);
    setSubmitted(true);
  }

  const info = [
    { icon: Phone, label: `${SITE_PHONE_PRIMARY} · ${SITE_PHONE_SECONDARY}` },
    { icon: Mail, label: SITE_EMAIL },
    { icon: Clock, label: t.contact.hours },
  ];

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-bold text-ink">{t.contact.pageTitle}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {t.contact.pageDesc}
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
          {SITE_LOCATIONS.map((loc) => (
            <a
              key={loc.label}
              href={loc.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm text-ink-soft hover:text-brand-red"
            >
              <MapPin size={18} className="shrink-0 text-brand-red" />
              {loc.label} — {t.contact.getDirections}
            </a>
          ))}
        </div>

        {submitted ? (
          <div className="rounded-xl border border-success/30 bg-success-light p-6 text-center">
            <p className="font-semibold text-success">{t.contact.messageSentTitle}</p>
            <p className="mt-1 text-sm text-ink-soft">{t.contact.messageSentDesc}</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-surface-border bg-surface p-6 shadow-soft"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{t.contact.fullNameLabel}</label>
                <input name="fullName" required className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{t.contact.emailLabel}</label>
                <input name="email" required type="email" className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">{t.contact.subjectLabel}</label>
              <input name="subject" required className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">{t.contact.messageLabel}</label>
              <textarea name="message" required rows={5} className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-red py-3 text-sm font-semibold text-white hover:bg-brand-red-dark"
            >
              {t.contact.sendButton}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
