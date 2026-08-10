"use client";

import { ChevronDown } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function FaqPage() {
  const { t } = useT();

  const faqGroups = [
    {
      title: t.faq.groupOrderingTitle,
      items: [
        {
          q: t.faq.orderingQ1,
          a: t.faq.orderingA1,
        },
        {
          q: t.faq.orderingQ2,
          a: t.faq.orderingA2,
        },
        {
          q: t.faq.orderingQ3,
          a: t.faq.orderingA3,
        },
      ],
    },
    {
      title: t.faq.groupShippingTitle,
      items: [
        {
          q: t.faq.shippingQ1,
          a: t.faq.shippingA1,
        },
        {
          q: t.faq.shippingQ2,
          a: t.faq.shippingA2,
        },
      ],
    },
    {
      title: t.faq.groupReturnsTitle,
      items: [
        {
          q: t.faq.returnsQ1,
          a: t.faq.returnsA1,
        },
        {
          q: t.faq.returnsQ2,
          a: t.faq.returnsA2,
        },
      ],
    },
    {
      title: t.faq.groupBusinessTitle,
      items: [
        {
          q: t.faq.businessQ1,
          a: t.faq.businessA1,
        },
      ],
    },
  ];

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-bold text-ink">{t.faq.title}</h1>
        <p className="mt-2 text-sm text-ink-soft">{t.faq.subtitle}</p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl space-y-8">
        {faqGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-brand-red">{group.title}</p>
            <div className="divide-y divide-surface-border rounded-xl border border-surface-border bg-surface shadow-soft">
              {group.items.map((item) => (
                <details key={item.q} className="group px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-ink marker:content-none">
                    {item.q}
                    <ChevronDown size={16} className="shrink-0 text-ink-soft transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
