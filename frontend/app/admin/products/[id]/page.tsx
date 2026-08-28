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
      .then((p) => {
        localStorage.setItem("gama-express-last-viewed-product", JSON.stringify({ id: p.id, title: p.title, sku: p.sku }));
        setInitial({
          id: p.id,
          sku: p.sku,
          slug: p.slug,
          title: p.title,
          shortDescription: p.shortDescription || "",
          description: p.description || "",
          categoryId: p.categoryId,
          brandId: p.brandId,
          manufacturerId: p.manufacturerId || "",
          partNumber: p.partNumber,
          manufacturerNumber: p.manufacturerNumber || "",
          locationCompany: p.locationCompany || "Gama Express SH.P.K",
          oemNumbers: (p.oemNumbers || []).join(", "),
          priceEur: String(p.priceEur),
          discountPriceEur: p.discountPriceEur != null ? String(p.discountPriceEur) : "",
          stockQuantity: String(p.stockQuantity),
          isFeatured: p.isFeatured,
          isActive: p.isActive,
          images: (p.images || []).map((img: any) => ({ url: img.url, altText: img.altText || "", originalUrl: img.originalUrl || undefined })),
          compatibility: (p.compatibility || []).map((c: any) => {
            const gen = c.engine?.generation;
            return {
              engineId: c.engineId,
              generationId: gen?.id ?? "",
              label: `${gen?.model?.make?.name ?? ""} ${gen?.model?.name ?? ""} ${gen?.name ?? ""} (${gen?.yearFrom ?? "?"}–${gen?.yearTo ?? "present"})`.trim(),
            };
          }),
        });
      })
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
