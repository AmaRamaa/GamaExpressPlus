"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { EntityCombobox, type EntityOption } from "./EntityCombobox";
import { ImageUploader, type ProductImageItem } from "./ImageUploader";

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export interface ProductFormValues {
  id?: string;
  sku: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  brandId: string;
  manufacturerId: string;
  partNumber: string;
  manufacturerNumber: string;
  oemNumbers: string;
  priceEur: string;
  discountPriceEur: string;
  stockQuantity: string;
  lowStockThreshold: string;
  isFeatured: boolean;
  isActive: boolean;
  images: ProductImageItem[];
}

const EMPTY: ProductFormValues = {
  sku: "",
  slug: "",
  title: "",
  shortDescription: "",
  description: "",
  categoryId: "",
  brandId: "",
  manufacturerId: "",
  partNumber: "",
  manufacturerNumber: "",
  oemNumbers: "",
  priceEur: "",
  discountPriceEur: "",
  stockQuantity: "0",
  lowStockThreshold: "5",
  isFeatured: false,
  isActive: true,
  images: [],
};

export function ProductForm({ initial }: { initial?: Partial<ProductFormValues> }) {
  const router = useRouter();
  const token = useAdminStore((s) => s.token);
  const [values, setValues] = useState<ProductFormValues>({ ...EMPTY, ...initial });
  const [brands, setBrands] = useState<EntityOption[]>([]);
  const [categories, setCategories] = useState<EntityOption[]>([]);
  const [manufacturers, setManufacturers] = useState<EntityOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!values.id;

  useEffect(() => {
    api.get<EntityOption[]>("/catalog/brands").then(setBrands).catch(() => {});
    api.get<EntityOption[]>("/catalog/categories").then(setCategories).catch(() => {});
    api.get<EntityOption[]>("/catalog/manufacturers").then(setManufacturers).catch(() => {});
  }, []);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function createBrand(name: string): Promise<EntityOption> {
    return api.post<EntityOption>("/catalog/brands", { name, slug: slugify(name) }, token);
  }
  async function createCategory(name: string): Promise<EntityOption> {
    return api.post<EntityOption>("/catalog/categories", { name, slug: slugify(name) }, token);
  }
  async function createManufacturer(name: string): Promise<EntityOption> {
    return api.post<EntityOption>("/catalog/manufacturers", { name, slug: slugify(name) }, token);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const priceEur = Number(values.priceEur);
    const stockQuantity = Number(values.stockQuantity);
    if (!values.sku.trim() || !values.title.trim() || !values.partNumber.trim()) {
      setError("SKU, title, and part number are required.");
      return;
    }
    if (!values.brandId || !values.categoryId) {
      setError("Select a brand and category.");
      return;
    }
    if (!Number.isFinite(priceEur) || priceEur < 0) {
      setError("Price must be a non-negative number.");
      return;
    }

    const stockStatus = stockQuantity === 0 ? "OUT_OF_STOCK" : stockQuantity <= Number(values.lowStockThreshold || 5) ? "LOW_STOCK" : "IN_STOCK";

    const payload = {
      sku: values.sku.trim(),
      slug: values.slug.trim() || slugify(values.sku),
      title: values.title.trim(),
      shortDescription: values.shortDescription.trim() || undefined,
      description: values.description.trim() || undefined,
      categoryId: values.categoryId,
      brandId: values.brandId,
      manufacturerId: values.manufacturerId || null,
      partNumber: values.partNumber.trim(),
      manufacturerNumber: values.manufacturerNumber.trim() || undefined,
      oemNumbers: values.oemNumbers.split(",").map((s) => s.trim()).filter(Boolean),
      priceEur,
      discountPriceEur: values.discountPriceEur.trim() ? Number(values.discountPriceEur) : undefined,
      stockQuantity,
      lowStockThreshold: Number(values.lowStockThreshold) || 5,
      stockStatus,
      isFeatured: values.isFeatured,
      isActive: values.isActive,
      images: {
        create: values.images
          .filter((img) => img.url.trim())
          .map((img, i) => ({ url: img.url.trim(), altText: img.altText?.trim() || undefined, sortOrder: i })),
      },
    };

    setSaving(true);
    try {
      if (isEdit) {
        const { images, ...updatePayload } = payload;
        await api.put(`/products/${values.id}`, updatePayload, token);
      } else {
        await api.post("/products", payload, token);
      }
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Basic info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Title *</Label>
            <Input
              value={values.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (!isEdit && !values.slug) set("slug", slugify(e.target.value));
              }}
              required
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={values.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated from title" />
          </div>
          <div>
            <Label>SKU *</Label>
            <Input value={values.sku} onChange={(e) => set("sku", e.target.value)} required />
          </div>
          <div>
            <Label>Part number *</Label>
            <Input value={values.partNumber} onChange={(e) => set("partNumber", e.target.value)} required />
          </div>
          <div>
            <Label>Manufacturer part number</Label>
            <Input value={values.manufacturerNumber} onChange={(e) => set("manufacturerNumber", e.target.value)} />
          </div>
          <div>
            <Label>OEM numbers (comma-separated)</Label>
            <Input value={values.oemNumbers} onChange={(e) => set("oemNumbers", e.target.value)} />
          </div>
          <div>
            <Label>Brand *</Label>
            <EntityCombobox
              value={values.brandId}
              onChange={(id) => set("brandId", id)}
              options={brands}
              placeholder="Select brand"
              onCreate={createBrand}
            />
          </div>
          <div>
            <Label>Category *</Label>
            <EntityCombobox
              value={values.categoryId}
              onChange={(id) => set("categoryId", id)}
              options={categories}
              placeholder="Select category"
              onCreate={createCategory}
            />
          </div>
          <div>
            <Label>Manufacturer</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <EntityCombobox
                  value={values.manufacturerId}
                  onChange={(id) => set("manufacturerId", id)}
                  options={manufacturers}
                  placeholder="Select manufacturer (optional)"
                  onCreate={createManufacturer}
                />
              </div>
              {values.manufacturerId && (
                <Button type="button" variant="ghost" size="sm" onClick={() => set("manufacturerId", "")}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Short description</Label>
            <Input value={values.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
          </div>
          <div>
            <Label>Full description</Label>
            <Textarea value={values.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing & stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label>Price (EUR) *</Label>
              <Input type="number" step="0.01" min="0" value={values.priceEur} onChange={(e) => set("priceEur", e.target.value)} required />
            </div>
            <div>
              <Label>Discount price (EUR)</Label>
              <Input type="number" step="0.01" min="0" value={values.discountPriceEur} onChange={(e) => set("discountPriceEur", e.target.value)} />
            </div>
            <div>
              <Label>Stock quantity</Label>
              <Input type="number" min="0" value={values.stockQuantity} onChange={(e) => set("stockQuantity", e.target.value)} />
            </div>
            <div>
              <Label>Low stock threshold</Label>
              <Input type="number" min="0" value={values.lowStockThreshold} onChange={(e) => set("lowStockThreshold", e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex gap-6">
            <label className="flex items-center gap-2 text-sm text-ink">
              <Checkbox checked={values.isFeatured} onCheckedChange={(v) => set("isFeatured", v === true)} />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <Checkbox checked={values.isActive} onCheckedChange={(v) => set("isActive", v === true)} />
              Active (visible on storefront)
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploader images={values.images} onChange={(images) => set("images", images)} token={token} productId={values.id} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
