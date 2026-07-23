"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, FolderTree } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";

interface Category {
  id: string;
  name: string;
  slug: string;
  children: Category[];
}

export default function AdminCategoriesPage() {
  const token = useAdminStore((s) => s.token);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    api.get<Category[]>("/catalog/categories").then(setCategories).catch(() => {});
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
      await api.post(
        "/catalog/categories",
        { name: name.trim(), slug: slugify(name), parentId: parentId || undefined },
        token
      );
      setName("");
      setParentId("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create category");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Categories</h1>
        <p className="text-sm text-ink-soft">{categories.length} top-level categories</p>
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-ink-soft">New category name</label>
          <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-red" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lighting" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Parent (optional)</label>
          <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-red" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">None (top-level)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-brand-red px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-red-dark disabled:opacity-60">
          <Plus size={16} /> Add
        </button>
      </form>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
        <ul className="divide-y divide-slate-100">
          {categories.map((c) => (
            <li key={c.id} className="px-4 py-2.5">
              <div className="flex items-center gap-3">
                <FolderTree size={14} className="text-slate-400" />
                <span className="text-sm font-medium text-ink">{c.name}</span>
                <span className="text-xs text-ink-soft">/{c.slug}</span>
              </div>
              {c.children?.length > 0 && (
                <ul className="ml-6 mt-1.5 space-y-1">
                  {c.children.map((sub) => (
                    <li key={sub.id} className="text-xs text-ink-soft">↳ {sub.name}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
          {categories.length === 0 && <li className="px-4 py-6 text-center text-sm text-ink-soft">No categories yet.</li>}
        </ul>
      </div>
    </div>
  );
}
