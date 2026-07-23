"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProductForm, type ProductFormValues } from "@/components/admin/ProductForm";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAdminStore((s) => s.token);
  const [initial, setInitial] = useState<Partial<ProductFormValues> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<any>(`/admin/products/${id}`, token)
      .then((p) =>
        setInitial({
          id: p.id,
          sku: p.sku,
          slug: p.slug,
          title: p.title,
          shortDescription: p.shortDescription || "",
          description: p.description || "",
          categoryId: p.categoryId,
          brandId: p.brandId,
          partNumber: p.partNumber,
          manufacturerNumber: p.manufacturerNumber || "",
          oemNumbers: (p.oemNumbers || []).join(", "),
          priceEur: String(p.priceEur),
          discountPriceEur: p.discountPriceEur != null ? String(p.discountPriceEur) : "",
          stockQuantity: String(p.stockQuantity),
          lowStockThreshold: String(p.lowStockThreshold),
          isFeatured: p.isFeatured,
          isActive: p.isActive,
          images: [],
        })
      )
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load product"));
  }, [id, token]);

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="font-display text-2xl font-bold text-ink">Edit product</h1>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      {initial && <ProductForm initial={initial} />}
      {!initial && !error && <p className="text-sm text-ink-soft">Loading…</p>}
    </div>
  );
}
