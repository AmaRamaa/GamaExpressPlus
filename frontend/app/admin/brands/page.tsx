"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, Tags } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";

interface Brand {
  id: string;
  name: string;
  slug: string;
  isOEM: boolean;
}

export default function AdminBrandsPage() {
  const token = useAdminStore((s) => s.token);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState("");
  const [isOEM, setIsOEM] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    api.get<Brand[]>("/catalog/brands").then(setBrands).catch(() => {});
  }

  useEffect(load, []);

  function slugify(s: string) {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/catalog/brands", { name: name.trim(), slug: slugify(name), isOEM }, token);
      setName("");
      setIsOEM(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create brand");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Brands</h1>
        <p className="text-sm text-ink-soft">{brands.length} brands</p>
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-ink-soft">New brand name</label>
          <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-red" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bosch" />
        </div>
        <label className="mb-2 flex items-center gap-1.5 text-xs text-ink-soft">
          <input type="checkbox" checked={isOEM} onChange={(e) => setIsOEM(e.target.checked)} /> OEM
        </label>
        <button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-brand-red px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-red-dark disabled:opacity-60">
          <Plus size={16} /> Add
        </button>
      </form>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
        <ul className="divide-y divide-slate-100">
          {brands.map((b) => (
            <li key={b.id} className="flex items-center gap-3 px-4 py-2.5">
              <Tags size={14} className="text-slate-400" />
              <span className="text-sm font-medium text-ink">{b.name}</span>
              <span className="text-xs text-ink-soft">/{b.slug}</span>
              {b.isOEM && <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">OEM</span>}
            </li>
          ))}
          {brands.length === 0 && <li className="px-4 py-6 text-center text-sm text-ink-soft">No brands yet.</li>}
        </ul>
      </div>
    </div>
  );
}
