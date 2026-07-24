"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Car } from "lucide-react";
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
  const featured = searchParams.get("featured") || "";

  const [selectedCategory, setSelectedCategory] = useState(categorySlug);
  const [sort, setSort] = useState(searchParams.get("sort") || "relevance");
  const [maxPrice, setMaxPrice] = useState(200);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any[]>("/catalog/categories").then((raw) => setCategories(raw.map(mapCategory))).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ limit: "48" });
    if (q) params.set("q", q);
    if (generationId) params.set("generationId", generationId);
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
  }, [q, generationId, selectedCategory, brandSlug, featured, sort, maxPrice]);

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">
          {q ? `Results for "${q}"` : generationId ? "Parts compatible with your vehicle" : "All parts"}
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
          <div className="mb-4 flex justify-end">
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

          {!loading && products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-surface-border bg-surface p-12 text-center">
              <p className="font-display text-lg font-semibold text-ink">No parts match those filters</p>
              <p className="mt-1 text-sm text-ink-soft">Try widening your price range or clearing a filter.</p>
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
