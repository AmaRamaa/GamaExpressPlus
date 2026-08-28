"use client";

import { Truck, Users, Package } from "lucide-react";
import { useT } from "@/lib/i18n";

const statIcons = [Package, Users, Truck];

export default function AboutContent({
  brands,
  supportedMakes,
}: {
  brands: string[];
  supportedMakes: string[];
}) {
  const { t } = useT();

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-wide text-brand-red">
          {t.about.badge}
        </span>
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">{t.about.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">{t.about.intro}</p>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
        {t.about.stats.map((s: { value: string; label: string }, i: number) => {
          const Icon = statIcons[i];
          return (
            <div key={s.label} className="rounded-xl border border-surface-border bg-surface p-4 text-center shadow-soft">
              <Icon size={20} className="mx-auto mb-2 text-brand-red" />
              <p className="font-display text-xl font-bold text-ink">{s.value}</p>
              <p className="mt-0.5 text-xs text-ink-soft">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mx-auto mt-14 max-w-3xl">
        <h2 className="mb-4 font-display text-xl font-bold text-ink">{t.about.whatWeStockTitle}</h2>
        <p className="text-sm leading-relaxed text-ink-soft">
          {t.about.whatWeStockIntro} {brands.join(", ")}
          {t.about.whatWeStockOutro}
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        <h2 className="mb-4 font-display text-xl font-bold text-ink">{t.about.vehiclesTitle}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {supportedMakes.map((make) => (
            <div
              key={make}
              className="flex items-center justify-center rounded-lg border border-surface-border bg-surface-muted px-3 py-5 text-center text-sm font-semibold text-ink-soft"
            >
              {make}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
