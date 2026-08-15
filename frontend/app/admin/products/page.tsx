"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Pencil, Wand2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";

interface ProductRow {
  id: string;
  sku: string;
  title: string;
  priceEur: number;
  stockQuantity: number;
  stockStatus: string;
  isActive: boolean;
  brand: { name: string };
  category: { name: string };
}

interface ListResponse {
  items: ProductRow[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminProductsPage() {
  const token = useAdminStore((s) => s.token);
  const user = useAdminStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const [data, setData] = useState<ListResponse | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [lastViewedId, setLastViewedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allOnPageSelected = !!data?.items.length && data.items.every((p) => selected.has(p.id));

  function toggleSelectAll() {
    if (!data) return;
    setSelected((prev) => {
      if (allOnPageSelected) {
        const next = new Set(prev);
        data.items.forEach((p) => next.delete(p.id));
        return next;
      }
      const next = new Set(prev);
      data.items.forEach((p) => next.add(p.id));
      return next;
    });
  }

  async function bulkSetActive(isActive: boolean) {
    if (selected.size === 0 || bulkBusy) return;
    if (!isActive && !confirm(`Deactivate ${selected.size} product(s)? They'll be hidden from the storefront.`)) return;
    setBulkBusy(true);
    try {
      await Promise.all(Array.from(selected).map((id) => api.put(`/products/${id}`, { isActive }, token)));
      setSelected(new Set());
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Bulk update failed");
    } finally {
      setBulkBusy(false);
    }
  }

  useEffect(() => {
    const raw = localStorage.getItem("gama-express-last-viewed-product");
    if (raw) {
      try {
        setLastViewedId(JSON.parse(raw).id ?? null);
      } catch {
        // ignore malformed value
      }
    }
  }, []);

  function load() {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (q) params.set("q", q);
    api
      .get<ListResponse>(`/admin/products?${params.toString()}`, token)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load products"));
  }

  useEffect(() => {
    load();
    setSelected(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Deactivate "${title}"? It will be hidden from the storefront.`)) return;
    try {
      await api.delete(`/products/${id}`, token);
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Products</h1>
          <p className="text-sm text-ink-soft">{data ? `${data.total} products` : "Loading…"}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link href="/admin/reprocess-photos" className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-ink hover:bg-slate-50">
              <Wand2 size={16} /> Reprocess all photos
            </Link>
          )}
          <Link href="/admin/products/new" className="flex items-center gap-1.5 rounded-lg bg-brand-red px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-red-dark">
            <Plus size={16} /> Add product
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <Search size={16} className="text-slate-400" />
        <input
          className="flex-1 text-sm text-ink outline-none"
          placeholder="Search by title, SKU, or part number…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (setPage(1), setSelected(new Set()), load())}
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-brand-red-light bg-brand-red-light/40 px-3 py-2">
          <span className="text-sm font-medium text-ink">{selected.size} selected</span>
          <div className="ml-auto flex gap-2">
            <button
              disabled={bulkBusy}
              onClick={() => bulkSetActive(true)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-slate-50 disabled:opacity-50"
            >
              Activate
            </button>
            <button
              disabled={bulkBusy}
              onClick={() => bulkSetActive(false)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-slate-50 disabled:opacity-50"
            >
              Deactivate
            </button>
            <button onClick={() => setSelected(new Set())} className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink">
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="w-8 px-3 py-2">
                <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll} className="size-3.5 rounded border-slate-300" />
              </th>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 font-medium">Brand</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium text-right">Price</th>
              <th className="px-3 py-2 font-medium text-right">Stock</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((p) => (
              <tr
                key={p.id}
                className={`border-b border-slate-50 hover:bg-slate-50 ${selected.has(p.id) ? "bg-brand-red-light/30" : p.id === lastViewedId ? "bg-brand-red-light/60" : ""}`}
              >
                <td className="px-3 py-1.5">
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelected(p.id)} className="size-3.5 rounded border-slate-300" />
                </td>
                <td className="px-3 py-1.5 font-medium text-ink">{p.title}</td>
                <td className="part-code px-3 py-1.5 text-ink-soft">{p.sku}</td>
                <td className="px-3 py-1.5 text-ink-soft">{p.brand?.name}</td>
                <td className="px-3 py-1.5 text-ink-soft">{p.category?.name}</td>
                <td className="px-3 py-1.5 text-right font-medium text-ink">€{p.priceEur.toFixed(2)}</td>
                <td className="px-3 py-1.5 text-right text-ink-soft">{p.stockQuantity}</td>
                <td className="px-3 py-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/products/${p.id}`} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink">
                      <Pencil size={15} />
                    </Link>
                    <button onClick={() => handleDelete(p.id, p.title)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-ink-soft">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40">
            Prev
          </button>
          <span className="text-sm text-ink-soft">Page {data.page} of {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
