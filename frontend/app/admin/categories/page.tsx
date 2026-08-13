"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, FolderTree, Pencil, Trash2, Check, X } from "lucide-react";
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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [rowBusy, setRowBusy] = useState<string | null>(null);

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

  function startEdit(c: Category) {
    setEditingId(c.id);
    setEditName(c.name);
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    setRowBusy(id);
    setError("");
    try {
      await api.patch(`/catalog/categories/${id}`, { name: editName.trim(), slug: slugify(editName) }, token);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update category");
    } finally {
      setRowBusy(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    setRowBusy(id);
    setError("");
    try {
      await api.delete(`/catalog/categories/${id}`, token);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete category");
    } finally {
      setRowBusy(null);
    }
  }

  function CategoryRow({ c, indent }: { c: Category; indent: boolean }) {
    return (
      <li className={`px-4 py-2.5 ${indent ? "pl-10" : ""}`}>
        <div className="flex items-center gap-3">
          {editingId === c.id ? (
            <>
              <input
                className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-brand-red"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
              <button onClick={() => saveEdit(c.id)} disabled={rowBusy === c.id} aria-label="Save" className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40">
                <Check size={16} />
              </button>
              <button onClick={() => setEditingId(null)} aria-label="Cancel" className="rounded p-1.5 text-slate-400 hover:bg-slate-100">
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <FolderTree size={14} className="text-slate-400" />
              <span className="text-sm font-medium text-ink">{indent ? "↳ " : ""}{c.name}</span>
              <span className="text-xs text-ink-soft">/{c.slug}</span>
              <div className="ml-auto flex gap-0.5">
                <button onClick={() => startEdit(c)} aria-label="Edit category" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(c.id, c.name)} disabled={rowBusy === c.id} aria-label="Delete category" className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40">
                  <Trash2 size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      </li>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Categories</h1>
        <p className="text-sm text-ink-soft">{categories.length} top-level categories</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="min-w-[140px] flex-1">
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
            <div key={c.id}>
              <CategoryRow c={c} indent={false} />
              {c.children?.map((sub) => <CategoryRow key={sub.id} c={sub} indent />)}
            </div>
          ))}
          {categories.length === 0 && <li className="px-4 py-6 text-center text-sm text-ink-soft">No categories yet.</li>}
        </ul>
      </div>
    </div>
  );
}
