"use client";

import { useState } from "react";
import { Car, ChevronDown, X } from "lucide-react";
import { useStore } from "@/lib/store";
import VehicleFinder from "./VehicleFinder";

export default function GarageBar() {
  const vehicle = useStore((s) => s.vehicle);
  const setVehicle = useStore((s) => s.setVehicle);
  const [open, setOpen] = useState(false);

  return (
    <div
      className={
        vehicle
          ? "border-b border-success/20 bg-success-light"
          : "border-b border-surface-border bg-surface-muted"
      }
    >
      <div className="container-page flex items-center justify-between py-2.5">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium"
        >
          <Car size={16} className={vehicle ? "text-success" : "text-ink-soft"} />
          {vehicle ? (
            <span className="text-ink">
              Fitting parts for{" "}
              <span className="font-semibold">
                {vehicle.makeName} {vehicle.modelName} — {vehicle.generationName}
              </span>{" "}
              <span className="text-ink-soft">({vehicle.year}{vehicle.variant ? `, ${vehicle.variant}` : ""})</span>
            </span>
          ) : (
            <span className="text-ink-soft">No vehicle selected — set your vehicle to see parts that fit</span>
          )}
          <ChevronDown size={14} className={`text-ink-soft transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {vehicle && (
          <button
            onClick={() => setVehicle(null)}
            className="flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-brand-red"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {open && (
        <div className="border-t border-surface-border bg-surface py-4">
          <div className="container-page">
            <VehicleFinder variant="inline" />
          </div>
        </div>
      )}
    </div>
  );
}
