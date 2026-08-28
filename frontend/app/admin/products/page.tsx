"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Trash2, Pencil, Wand2, Sparkles, Languages, StarOff } from "lucide-react";
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
  brandId: string;
  categoryId: string;
  manufacturerId: string | null;
  brand: { name: string };
  category: { name: string };
  manufacturer: { name: string } | null;
}

interface ListResponse {
  items: ProductRow[];
  total: number;
  page: number;
  totalPages: number;
}

interface FilterOption {
  id: string;
  name: string;
}

function AdminProductsPageContent() {
  const token = useAdminStore((s) => s.token);
  const user = useAdminStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Search/pagination/filters live in the URL (not local state) so they
  // survive navigating away and back -- e.g. clicking into a product to edit
  // it and then hitting Back used to always dump you on page 1 with filters
  // cleared, since a fresh mount reset every one of these to its default.
  const q = searchParams.get("q") || "";
  const page = Number(searchParams.get("page")) || 1;
  const filterBrandId = searchParams.get("brandId") || "";
  const filterCategoryId = searchParams.get("categoryId") || "";
  const filterManufacturerId = searchParams.get("manufacturerId") || "";
  const filterActive = (searchParams.get("isActive") || "") as "" | "true" | "false";

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const [qInput, setQInput] = useState(q);
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState("");
  const [lastViewedId, setLastViewedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [brandOptions, setBrandOptions] = useState<FilterOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<FilterOption[]>([]);
  const [manufacturerOptions, setManufacturerOptions] = useState<FilterOption[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: string; field: "price" | "stock" } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  // Keep the search box in sync when the URL changes from elsewhere (e.g. browser back/forward).
  useEffect(() => setQInput(q), [q]);

  useEffect(() => {
    api.get<FilterOption[]>("/catalog/brands").then(setBrandOptions).catch(() => {});
    api.get<FilterOption[]>("/catalog/categories?includeInternal=true").then(setCategoryOptions).catch(() => {});
    api.get<FilterOption[]>("/catalog/manufacturers").then(setManufacturerOptions).catch(() => {});
  }, []);

  function startEdit(row: ProductRow, field: "price" | "stock") {
    setEditingCell({ id: row.id, field });
    setEditValue(field === "price" ? String(row.priceEur) : String(row.stockQuantity));
  }

  function cancelEdit() {
    setEditingCell(null);
    setEditValue("");
  }

  // Auto-saves on blur/Enter -- no separate "Save" step, so the change is
  // already persisted by the time you click away or navigate elsewhere,
  // the same way a spreadsheet commits a cell on losing focus.
  async function commitEdit() {
    if (!editingCell || !data) return;
    const row = data.items.find((p) => p.id === editingCell.id);
    if (!row) return cancelEdit();

    const field = editingCell.field;
    const num = Number(editValue);
    if (editValue.trim() === "" || Number.isNaN(num) || num < 0) return cancelEdit();

    const unchanged = field === "price" ? num === row.priceEur : num === row.stockQuantity;
    if (unchanged) return cancelEdit();

    const payload =
      field === "price"
        ? { priceEur: num }
        : { stockQuantity: num, stockStatus: num === 0 ? "OUT_OF_STOCK" : "IN_STOCK" };

    setSavingId(row.id);
    setEditingCell(null);
    try {
      await api.put(`/products/${row.id}`, payload, token);
      setData((d) =>
        d ? { ...d, items: d.items.map((p) => (p.id === row.id ? { ...p, ...payload } : p)) } : d
      );
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to save");
    } finally {
      setSavingId(null);
    }
  }

  async function toggleRowActive(row: ProductRow) {
    if (savingId) return;
    const nextActive = !row.isActive;
    if (!nextActive && !confirm(`Deactivate "${row.title}"? It will be hidden from the storefront.`)) return;
    setSavingId(row.id);
    try {
      await api.put(`/products/${row.id}`, { isActive: nextActive }, token);
      setData((d) =>
        d ? { ...d, items: d.items.map((p) => (p.id === row.id ? { ...p, isActive: nextActive } : p)) } : d
      );
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to save");
    } finally {
      setSavingId(null);
    }
  }

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
    if (filterBrandId) params.set("brandId", filterBrandId);
    if (filterCategoryId) params.set("categoryId", filterCategoryId);
    if (filterManufacturerId) params.set("manufacturerId", filterManufacturerId);
    if (filterActive) params.set("isActive", filterActive);
    api
      .get<ListResponse>(`/admin/products?${params.toString()}`, token)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load products"));
  }

  useEffect(() => {
    load();
    setSelected(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, q, page, filterBrandId, filterCategoryId, filterManufacturerId, filterActive]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Deactivate "${title}"? It will be hidden from the storefront.`)) return;
    try {
      await api.delete(`/products/${id}`, token);
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to delete");
    }
  }

  async function handleClearFeatured() {
    if (!confirm("Remove every product from \"Featured\"? They stay active on the storefront -- this only clears the featured flag so you can pick a fresh set.")) return;
    try {
      const { count } = await api.post<{ count: number }>("/admin/products/clear-featured", {}, token);
      alert(`Cleared ${count} product${count === 1 ? "" : "s"} from Featured.`);
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to clear featured products");
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
            <>
              <Link href="/admin/complete-drafts" className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-ink hover:bg-slate-50">
                <Sparkles size={16} /> Complete drafts
              </Link>
              <Link href="/admin/translate-products" className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-ink hover:bg-slate-50">
                <Languages size={16} /> Translate products
              </Link>
              <Link href="/admin/reprocess-photos" className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-ink hover:bg-slate-50">
                <Wand2 size={16} /> Reprocess all photos
              </Link>
              <button type="button" onClick={handleClearFeatured} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-ink hover:bg-slate-50">
                <StarOff size={16} /> Clear featured
              </button>
            </>
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
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && updateParams({ q: qInput, page: "1" })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filterBrandId}
          onChange={(e) => updateParams({ brandId: e.target.value, page: "1" })}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-ink"
        >
          <option value="">All brands</option>
          {brandOptions.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select
          value={filterCategoryId}
          onChange={(e) => updateParams({ categoryId: e.target.value, page: "1" })}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-ink"
        >
          <option value="">All categories</option>
          {categoryOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={filterManufacturerId}
          onChange={(e) => updateParams({ manufacturerId: e.target.value, page: "1" })}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-ink"
        >
          <option value="">All manufacturers</option>
          {manufacturerOptions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select
          value={filterActive}
          onChange={(e) => updateParams({ isActive: e.target.value, page: "1" })}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-ink"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        {(filterBrandId || filterCategoryId || filterManufacturerId || filterActive) && (
          <button
            onClick={() => updateParams({ brandId: "", categoryId: "", manufacturerId: "", isActive: "", page: "1" })}
            className="text-xs font-medium text-ink-soft hover:text-ink"
          >
            Clear filters
          </button>
        )}
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
              <th className="px-3 py-2 font-medium">Manufacturer</th>
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
                <td className="px-3 py-1.5 text-ink-soft">{p.manufacturer?.name || "—"}</td>
                <td className="px-3 py-1.5 text-right font-medium text-ink">
                  {editingCell?.id === p.id && editingCell.field === "price" ? (
                    <div className="flex items-center justify-end gap-1">
                      <input
                        autoFocus
                        type="number"
                        step="0.01"
                        min="0"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit();
                          else if (e.key === "Escape") cancelEdit();
                        }}
                        className="w-20 rounded border border-brand-red px-1.5 py-0.5 text-right text-sm outline-none"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(p, "price")}
                      disabled={savingId === p.id}
                      className="rounded px-1.5 py-0.5 hover:bg-slate-100 disabled:opacity-50"
                      title="Click to edit"
                    >
                      €{p.priceEur.toFixed(2)}
                    </button>
                  )}
                </td>
                <td className="px-3 py-1.5 text-right text-ink-soft">
                  {editingCell?.id === p.id && editingCell.field === "stock" ? (
                    <input
                      autoFocus
                      type="number"
                      min="0"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        else if (e.key === "Escape") cancelEdit();
                      }}
                      className="w-16 rounded border border-brand-red px-1.5 py-0.5 text-right text-sm outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(p, "stock")}
                      disabled={savingId === p.id}
                      className="rounded px-1.5 py-0.5 hover:bg-slate-100 disabled:opacity-50"
                      title="Click to edit"
                    >
                      {p.stockQuantity}
                    </button>
                  )}
                </td>
                <td className="px-3 py-1.5">
                  <button
                    onClick={() => toggleRowActive(p)}
                    disabled={savingId === p.id}
                    title="Click to toggle"
                    className={`rounded-full px-2 py-0.5 text-xs font-medium disabled:opacity-50 ${p.isActive ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  >
                    {p.isActive ? "Active" : "Inactive"}
                  </button>
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
                <td colSpan={10} className="px-4 py-8 text-center text-ink-soft">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40">
            Prev
          </button>
          <span className="text-sm text-ink-soft">Page {data.page} of {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => updateParams({ page: String(page + 1) })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">Loading…</p>}>
      <AdminProductsPageContent />
    </Suspense>
  );
}
