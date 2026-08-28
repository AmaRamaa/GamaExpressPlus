"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, Factory, Pencil, Trash2, Check, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";

interface Manufacturer {
  id: string;
  name: string;
  slug: string;
}

export default function AdminManufacturersPage() {
  const token = useAdminStore((s) => s.token);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  function load() {
    api.get<Manufacturer[]>("/catalog/manufacturers").then(setManufacturers).catch(() => {});
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
      await api.post("/catalog/manufacturers", { name: name.trim(), slug: slugify(name) }, token);
      setName("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create manufacturer");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(m: Manufacturer) {
    setEditingId(m.id);
    setEditName(m.name);
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    setRowBusy(id);
    setError("");
    try {
      await api.patch(`/catalog/manufacturers/${id}`, { name: editName.trim(), slug: slugify(editName) }, token);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update manufacturer");
    } finally {
      setRowBusy(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    setRowBusy(id);
    setError("");
    try {
      await api.delete(`/catalog/manufacturers/${id}`, token);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete manufacturer");
    } finally {
      setRowBusy(null);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Manufacturers</h1>
        <p className="text-sm text-ink-soft">{manufacturers.length} manufacturers</p>
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-ink-soft">New manufacturer name</label>
          <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-red" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Volkswagen AG" />
        </div>
        <button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-brand-red px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-red-dark disabled:opacity-60">
          <Plus size={16} /> Add
        </button>
      </form>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
        <ul className="divide-y divide-slate-100">
          {manufacturers.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
              {editingId === m.id ? (
                <>
                  <input
                    className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-brand-red"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <button onClick={() => saveEdit(m.id)} disabled={rowBusy === m.id} aria-label="Save" className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingId(null)} aria-label="Cancel" className="rounded p-1.5 text-slate-400 hover:bg-slate-100">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <Factory size={14} className="text-slate-400" />
                  <span className="text-sm font-medium text-ink">{m.name}</span>
                  <span className="text-xs text-ink-soft">/{m.slug}</span>
                  <div className="ml-auto flex gap-0.5">
                    <button onClick={() => startEdit(m)} aria-label="Edit manufacturer" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(m.id, m.name)} disabled={rowBusy === m.id} aria-label="Delete manufacturer" className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
          {manufacturers.length === 0 && <li className="px-4 py-6 text-center text-sm text-ink-soft">No manufacturers yet.</li>}
        </ul>
      </div>
    </div>
  );
}
