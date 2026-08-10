"use client";

import { Truck, MapPinned, Store, Clock } from "lucide-react";
import { SITE_LOCATIONS } from "@/lib/constants";
import { useT } from "@/lib/i18n";

export default function ShippingPage() {
  const { t } = useT();

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <Truck size={28} className="mx-auto mb-3 text-brand-red" />
        <h1 className="font-display text-3xl font-bold text-ink">{t.shipping.title}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {t.shipping.subtitle}
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl overflow-x-auto rounded-xl border border-surface-border bg-surface shadow-soft">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead className="border-b border-surface-border bg-surface-muted text-xs font-semibold uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="px-4 py-3">{t.shipping.tableMethod}</th>
              <th className="px-4 py-3">{t.shipping.tableTime}</th>
              <th className="px-4 py-3">{t.shipping.tableCost}</th>
              <th className="px-4 py-3">{t.shipping.tableCoverage}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {t.shipping.methods.map((m) => (
              <tr key={m.name}>
                <td className="px-4 py-3 font-medium text-ink">{m.name}</td>
                <td className="px-4 py-3 text-ink-soft">{m.time}</td>
                <td className="px-4 py-3 text-ink-soft">{m.cost}</td>
                <td className="px-4 py-3 text-ink-soft">{m.zones}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mx-auto mt-6 grid max-w-3xl gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-surface-border bg-surface p-4 shadow-soft">
          <Clock size={18} className="mb-2 text-brand-red" />
          <p className="text-sm font-semibold text-ink">{t.shipping.cutoffTitle}</p>
          <p className="mt-1 text-xs text-ink-soft">{t.shipping.cutoffDesc}</p>
        </div>
        <div className="rounded-xl border border-surface-border bg-surface p-4 shadow-soft">
          <MapPinned size={18} className="mb-2 text-brand-red" />
          <p className="text-sm font-semibold text-ink">{t.shipping.trackingTitle}</p>
          <p className="mt-1 text-xs text-ink-soft">{t.shipping.trackingDesc}</p>
        </div>
        <div className="rounded-xl border border-surface-border bg-surface p-4 shadow-soft">
          <Store size={18} className="mb-2 text-brand-red" />
          <p className="text-sm font-semibold text-ink">{t.shipping.pickupTitle}</p>
          <p className="mt-1 text-xs text-ink-soft">
            {SITE_LOCATIONS.map((loc, i) => (
              <span key={loc.label}>
                {i > 0 && " · "}
                <a href={loc.mapsUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-red hover:underline">
                  {loc.label}
                </a>
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}
