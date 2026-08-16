"use client";

import { useState } from "react";
import { PackageSearch } from "lucide-react";
import { useT } from "@/lib/i18n";
import { SITE_EMAIL } from "@/lib/constants";
import { buildMailtoUrl } from "@/lib/mailto";

export default function RequestPartPage() {
  const [submitted, setSubmitted] = useState(false);
  const { t } = useT();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fullName = form.get("fullName") as string;
    const email = form.get("email") as string;
    const phone = form.get("phone") as string;
    const vehicle = form.get("vehicle") as string;
    const oem = form.get("oem") as string;
    const partDesc = form.get("partDesc") as string;

    window.location.href = buildMailtoUrl(SITE_EMAIL, `[Part Request] ${fullName}`, [
      ["Name", fullName],
      ["Email", email],
      ["Phone", phone],
      ["Vehicle", vehicle],
      ["OEM number", oem],
      ["Part description", partDesc],
    ]);
    setSubmitted(true);
  }

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 text-center">
          <PackageSearch size={28} className="mx-auto mb-3 text-brand-red" />
          <h1 className="font-display text-2xl font-bold text-ink">{t.requestPart.pageTitle}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {t.requestPart.pageDesc}
          </p>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-success/30 bg-success-light p-6 text-center">
            <p className="font-semibold text-success">{t.requestPart.successTitle}</p>
            <p className="mt-1 text-sm text-ink-soft">{t.requestPart.successDesc}</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-surface-border bg-surface p-6 shadow-soft"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{t.requestPart.fullNameLabel}</label>
                <input name="fullName" required className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{t.requestPart.emailLabel}</label>
                <input name="email" required type="email" className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">{t.requestPart.phoneLabel}</label>
              <input name="phone" className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">{t.requestPart.vehicleLabel}</label>
              <input name="vehicle" placeholder={t.requestPart.vehiclePlaceholder} className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">{t.requestPart.oemLabel}</label>
              <input name="oem" className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">{t.requestPart.partDescLabel}</label>
              <textarea name="partDesc" required rows={4} className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-red py-3 text-sm font-semibold text-white hover:bg-brand-red-dark"
            >
              {t.requestPart.submitButton}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
