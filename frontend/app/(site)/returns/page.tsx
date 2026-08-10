"use client";

import Link from "next/link";
import { RotateCcw, ShieldCheck, XCircle, ListChecks } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function ReturnsPage() {
  const { t } = useT();

  const sections = [
    {
      icon: RotateCcw,
      title: t.returns.windowTitle,
      body: t.returns.windowBody,
    },
    {
      icon: ShieldCheck,
      title: t.returns.warrantyTitle,
      body: t.returns.warrantyBody,
    },
    {
      icon: ListChecks,
      title: t.returns.howToTitle,
      body: t.returns.howToBody,
    },
    {
      icon: XCircle,
      title: t.returns.nonReturnableTitle,
      body: t.returns.nonReturnableBody,
    },
  ];

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-bold text-ink">{t.returns.pageTitle}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {t.returns.pageDesc}
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <div key={s.title} className="rounded-xl border border-surface-border bg-surface p-5 shadow-soft">
            <s.icon size={20} className="mb-3 text-brand-red" />
            <p className="font-display text-base font-semibold text-ink">{s.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-surface-border bg-surface-muted p-5 text-center text-sm text-ink-soft">
        {t.returns.helpQuestion}<Link href="/contact" className="font-medium text-brand-red hover:underline">{t.returns.contactSupport}</Link>{t.returns.helpClosing}
      </div>
    </div>
  );
}
