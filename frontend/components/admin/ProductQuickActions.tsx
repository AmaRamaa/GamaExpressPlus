"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Car, Pencil, ExternalLink, Copy, X, Check } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import VehicleAutocomplete, { type VehicleSearchEntry } from "@/components/VehicleAutocomplete";

export interface QuickActionProduct {
  id: string;
  slug: string;
  sku: string;
  title: string;
}

interface SavedFitment {
  engineId: string;
  generationId: string;
  label: string;
}

const MENU_WIDTH = 232;

function MenuItem({ icon, children, onClick }: { icon: ReactNode; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink hover:bg-slate-50"
    >
      <span className="text-slate-400">{icon}</span>
      {children}
    </button>
  );
}

// Right-click menu for a row in the admin product list: the few things you
// usually want to do to a product without opening its full edit form.
export function ProductContextMenu({
  x,
  y,
  product,
  canEdit,
  onAddVehicle,
  onClose,
}: {
  x: number;
  y: number;
  product: QuickActionProduct;
  canEdit: boolean;
  onAddVehicle: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  // Keep the menu on screen when opened near the right/bottom edge.
  const itemCount = canEdit ? 4 : 3;
  const left = Math.max(8, Math.min(x, window.innerWidth - MENU_WIDTH - 8));
  const top = Math.max(8, Math.min(y, window.innerHeight - itemCount * 38 - 40));

  return (
    <div
      ref={ref}
      role="menu"
      style={{ left, top, width: MENU_WIDTH }}
      className="fixed z-50 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lifted"
    >
      <p className="truncate border-b border-slate-100 px-3 pb-1.5 pt-1 text-xs font-medium text-ink-soft">{product.title}</p>
      {canEdit && (
        <MenuItem
          icon={<Car size={15} />}
          onClick={() => {
            onClose();
            onAddVehicle();
          }}
        >
          Add compatible vehicle…
        </MenuItem>
      )}
      <MenuItem icon={<Pencil size={15} />} onClick={() => router.push(`/admin/products/${product.id}`)}>
        Edit product
      </MenuItem>
      <MenuItem
        icon={<ExternalLink size={15} />}
        onClick={() => {
          window.open(`/products/${product.slug}`, "_blank", "noopener");
          onClose();
        }}
      >
        View on storefront
      </MenuItem>
      <MenuItem
        icon={<Copy size={15} />}
        onClick={() => {
          navigator.clipboard?.writeText(product.sku).catch(() => {});
          onClose();
        }}
      >
        Copy SKU ({product.sku})
      </MenuItem>
    </div>
  );
}

// Small popup for linking a product to vehicles straight from the list: shows
// what it already fits, and adds each vehicle you pick immediately.
export function QuickAddVehicleModal({ product, onClose }: { product: QuickActionProduct; onClose: () => void }) {
  const token = useAdminStore((s) => s.token);
  const [fitment, setFitment] = useState<SavedFitment[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get<any>(`/admin/products/${product.id}`, token)
      .then((p) =>
        setFitment(
          (p.compatibility || []).map((c: any) => {
            const gen = c.engine?.generation;
            return {
              engineId: c.engineId,
              generationId: gen?.id ?? "",
              label: `${gen?.model?.make?.name ?? ""} ${gen?.model?.name ?? ""} ${gen?.name ?? ""} (${gen?.yearFrom ?? "?"}–${gen?.yearTo ?? "present"})`.trim(),
            };
          })
        )
      )
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not load this product's vehicles."));
  }, [product.id, token]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function add(entry: VehicleSearchEntry) {
    if (!fitment || busy) return;
    setError("");
    setNotice("");
    if (fitment.some((f) => f.generationId === entry.generationId)) {
      setNotice("Already linked to that vehicle.");
      return;
    }
    setBusy(true);
    try {
      // Fitment is tracked per generation; this also creates the "ALL"
      // placeholder engine when a generation has none, same as the form.
      const engines = await api.get<{ id: string }[]>(`/vehicles/generations/${entry.generationId}/engines`);
      const engine = engines[0];
      if (!engine) throw new Error("That vehicle has no engine record to link to.");

      // The save replaces the product's whole fitment list, so send back
      // everything it already has plus the new one.
      await api.put(
        `/products/${product.id}`,
        { compatibility: { create: [...fitment.map((f) => ({ engineId: f.engineId })), { engineId: engine.id }] } },
        token
      );
      const label = `${entry.makeName} ${entry.modelName} ${entry.generationName} (${entry.yearFrom}–${entry.yearTo ?? "present"})`;
      setFitment([...fitment, { engineId: engine.id, generationId: entry.generationId, label }]);
      setNotice(`Added ${label}`);
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : "Could not add that vehicle.");
    } finally {
      setBusy(false);
    }
  }

  // One chip per vehicle, even if the product is linked to several engines of it.
  const uniqueVehicles = fitment ? Array.from(new Map(fitment.map((f) => [f.generationId, f.label])).values()) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl bg-white p-5 shadow-lifted"
        role="dialog"
        aria-label="Add compatible vehicle"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-ink">Add compatible vehicle</h2>
            <p className="truncate text-xs text-ink-soft">{product.title}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-ink-soft hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <VehicleAutocomplete
          placeholder="Type a car, e.g. Skoda Scala 2023"
          onSelect={add}
          inputClassName="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-red"
        />

        {error && <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-600">{error}</p>}
        {notice && !error && (
          <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-700">
            <Check size={13} /> {notice}
          </p>
        )}

        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">Currently fits</p>
          {fitment === null && !error && <p className="text-sm text-ink-soft">Loading…</p>}
          {fitment !== null && uniqueVehicles.length === 0 && (
            <p className="text-sm text-ink-soft">No specific vehicle yet (universal fit).</p>
          )}
          <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
            {uniqueVehicles.map((label) => (
              <span key={label} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-ink">
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-dark">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
