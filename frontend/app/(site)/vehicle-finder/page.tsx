"use client";

import { useT } from "@/lib/i18n";
import VehicleFinder from "@/components/VehicleFinder";

export default function VehicleFinderPage() {
  const { t } = useT();

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-bold text-ink">{t.vehicleFinderPage.title}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {t.vehicleFinderPage.description}
        </p>
      </div>
      <div className="mx-auto mt-8 max-w-2xl">
        <VehicleFinder />
      </div>
      <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-surface-border bg-surface-muted p-5 text-sm text-ink-soft">
        <p className="font-semibold text-ink">{t.vehicleFinderPage.notSureTitle}</p>
        <p className="mt-1">
          {t.vehicleFinderPage.notSureDesc}
        </p>
      </div>
    </div>
  );
}
