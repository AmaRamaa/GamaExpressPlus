"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Car, LayoutGrid, List } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import VehicleFinder from "@/components/VehicleFinder";
import { api } from "@/lib/api";
import { mapProduct, mapCategory } from "@/lib/adapters";
import type { Product, Category } from "@/lib/types";

interface ProductListResponse {
  items: any[];
  total: number;
}

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const categorySlug = searchParams.get("category") || "";
  const brandSlug = searchParams.get("brand") || "";
  const generationId = searchParams.get("generationId") || "";
  const modelId = searchParams.get("modelId") || "";
  const makeId = searchParams.get("makeId") || "";
  const featured = searchParams.get("featured") || "";

  const [selectedCategory, setSelectedCategory] = useState(categorySlug);
  const [sort, setSort] = useState(searchParams.get("sort") || "relevance");
  const [maxPrice, setMaxPrice] = useState(200);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<any[]>("/catalog/categories")
      .then((raw) => setCategories(raw.map(mapCategory)))
      .catch(() => {})
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("gama-express-products-view");
    if (saved === "grid" || saved === "list") setView(saved);
  }, []);

  function changeView(next: "grid" | "list") {
    setView(next);
    localStorage.setItem("gama-express-products-view", next);
  }

  useEffect(() => {
    const params = new URLSearchParams({ limit: "48" });
    if (q) params.set("q", q);
    // Only the most specific vehicle filter present is sent -- generation is
    // exact, model/make are progressively broader fallbacks (see VehicleFinder).
    if (generationId) params.set("generationId", generationId);
    else if (modelId) params.set("modelId", modelId);
    else if (makeId) params.set("makeId", makeId);
    if (selectedCategory) params.set("category", selectedCategory);
    if (brandSlug) params.set("brand", brandSlug);
    if (featured) params.set("featured", featured);
    if (maxPrice < 200) params.set("maxPrice", String(maxPrice));
    if (sort !== "rating") params.set("sort", sort);

    setLoading(true);
    api
      .get<ProductListResponse>(`/products?${params.toString()}`)
      .then((res) => {
        let items = res.items.map(mapProduct);
        if (sort === "rating") items = [...items].sort((a, b) => b.rating - a.rating);
        setProducts(items);
        setTotal(res.total);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [q, generationId, modelId, makeId, selectedCategory, brandSlug, featured, sort, maxPrice]);

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">
          {q ? `Results for "${q}"` : generationId || modelId || makeId ? "Parts compatible with your vehicle" : "All parts"}
        </h1>
        <p className="text-sm text-ink-soft">{loading ? "Loading…" : `${total} products found`}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Filters sidebar */}
        <aside className="space-y-6">
          <div className="rounded-xl border border-surface-border bg-surface p-4 shadow-soft">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <SlidersHorizontal size={14} /> Category
            </p>
            {categoriesLoading ? (
              // Reserves roughly the space the real category list will
              // take, so it doesn't pop in and push the vehicle finder /
              // price slider / results grid down once it loads.
              <div className="animate-pulse space-y-2.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-3.5 rounded bg-surface-muted" style={{ width: `${60 + (i % 3) * 15}%` }} />
                ))}
              </div>
            ) : (
              <ul className="space-y-1.5 text-sm">
                <li>
                  <button onClick={() => setSelectedCategory("")} className={`text-left ${!selectedCategory ? "font-semibold text-brand-red" : "text-ink-soft hover:text-ink"}`}>
                    All categories
                  </button>
                </li>
                {categories.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedCategory(c.slug)}
                      className={`text-left ${selectedCategory === c.slug ? "font-semibold text-brand-red" : "text-ink-soft hover:text-ink"}`}
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-surface-border bg-surface p-4 shadow-soft">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <Car size={14} /> Your vehicle
            </p>
            <VehicleFinder variant="inline" />
          </div>

          <div className="rounded-xl border border-surface-border bg-surface p-4 shadow-soft">
            <p className="mb-3 text-sm font-semibold text-ink">Max price: €{maxPrice}</p>
            <input
              type="range" min={10} max={200} step={10}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-brand-red"
            />
          </div>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-4 flex items-center justify-end gap-2">
            <div className="flex items-center rounded-lg border border-surface-border bg-surface p-0.5">
              <button
                type="button"
                onClick={() => changeView("grid")}
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                className={`flex items-center justify-center rounded-md p-1.5 ${view === "grid" ? "bg-brand-red text-white" : "text-ink-soft hover:text-ink"}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => changeView("list")}
                aria-label="List view"
                aria-pressed={view === "list"}
                className={`flex items-center justify-center rounded-md p-1.5 ${view === "list" ? "bg-brand-red text-white" : "text-ink-soft hover:text-ink"}`}
              >
                <List size={16} />
              </button>
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm"
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          {loading && products.length === 0 ? (
            // Same shape as the real results (per view mode) -- reserves the
            // height up front instead of popping content into empty space
            // once the fetch resolves (was a big source of layout shift).
            view === "list" ? (
              <div className="flex animate-pulse flex-col gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-surface-border bg-surface px-3 py-2">
                    <div className="h-5 w-16 rounded-full bg-surface-muted" />
                    <div className="h-3.5 flex-1 rounded bg-surface-muted" />
                    <div className="hidden h-3 w-20 rounded bg-surface-muted md:block" />
                    <div className="h-4 w-14 rounded bg-surface-muted" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-surface-border bg-surface p-3">
                    <div className="mb-3 aspect-square rounded-lg bg-surface-muted" />
                    <div className="mb-2 h-3 w-1/3 rounded bg-surface-muted" />
                    <div className="mb-3 h-4 w-full rounded bg-surface-muted" />
                    <div className="h-5 w-1/2 rounded bg-surface-muted" />
                  </div>
                ))}
              </div>
            )
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-surface-border bg-surface p-12 text-center">
              <p className="font-display text-lg font-semibold text-ink">No parts match those filters</p>
              <p className="mt-1 text-sm text-ink-soft">Try widening your price range or clearing a filter.</p>
            </div>
          ) : view === "list" ? (
            <div className="flex flex-col gap-3">
              {products.map((p) => <ProductCard key={p.id} product={p} layout="list" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container-page py-16 text-center text-ink-soft">Loading…</div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
