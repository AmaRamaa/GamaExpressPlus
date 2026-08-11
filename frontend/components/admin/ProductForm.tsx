"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, Loader2, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";

interface Brand { id: string; name: string }
interface Category { id: string; name: string }
interface ImageRow { url: string; altText: string }
interface PendingUpload {
  id: string;
  previewUrl: string;
  fileName: string;
  status: "uploading" | "error";
  errorMessage?: string;
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
  partNumber: string;
  manufacturerNumber: string;
  oemNumbers: string;
  priceEur: string;
  discountPriceEur: string;
  stockQuantity: string;
  lowStockThreshold: string;
  isFeatured: boolean;
  isActive: boolean;
  images: ImageRow[];
}

const EMPTY: ProductFormValues = {
  sku: "",
  slug: "",
  title: "",
  shortDescription: "",
  description: "",
  categoryId: "",
  brandId: "",
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

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-red";
const labelClass = "mb-1 block text-xs font-medium text-ink-soft";

export function ProductForm({ initial }: { initial?: Partial<ProductFormValues> }) {
  const router = useRouter();
  const token = useAdminStore((s) => s.token);
  const [values, setValues] = useState<ProductFormValues>({ ...EMPTY, ...initial });
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadsRef = useRef<PendingUpload[]>([]);

  const isEdit = !!values.id;

  useEffect(() => {
    api.get<Brand[]>("/catalog/brands").then(setBrands).catch(() => {});
    api.get<Category[]>("/catalog/categories").then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    pendingUploadsRef.current = pendingUploads;
  }, [pendingUploads]);

  // Revoke any outstanding local object URLs when the form unmounts.
  useEffect(() => {
    return () => {
      pendingUploadsRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploadError("");
    Array.from(fileList).forEach((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const previewUrl = URL.createObjectURL(file);
      setPendingUploads((prev) => [...prev, { id, previewUrl, fileName: file.name, status: "uploading" }]);
      uploadOneFile(id, file);
    });
  }

  async function uploadOneFile(id: string, file: File) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await api.upload<{ url: string; publicId?: string }>("/uploads", formData, token);
      // Functional update: parallel uploads resolve in any order, so this
      // must append onto the latest state, not a `values` closed over when
      // this upload started.
      setValues((v) => ({ ...v, images: [...v.images, { url: data.url, altText: "" }] }));
      setPendingUploads((prev) => {
        const done = prev.find((p) => p.id === id);
        if (done) URL.revokeObjectURL(done.previewUrl);
        return prev.filter((p) => p.id !== id);
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Upload failed";
      setPendingUploads((prev) => prev.map((p) => (p.id === id ? { ...p, status: "error", errorMessage: message } : p)));
      setUploadError("Upload failed, try again or paste an image URL below instead.");
    }
  }

  function dismissPendingUpload(id: string) {
    setPendingUploads((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  function slugify(s: string) {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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
          .map((img, i) => ({ url: img.url.trim(), altText: img.altText.trim() || undefined, sortOrder: i })),
      },
    };

    setSaving(true);
    try {
      if (isEdit) {
        const { images, ...updatePayload } = payload;
        await api.put(`/products/${values.id}`, updatePayload, token);
      } else {
        const staffName = localStorage.getItem("gama-express-staff-name") || undefined;
        await api.post("/products", { ...payload, ...(staffName ? { staffName } : {}) }, token);
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

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="mb-4 font-display text-sm font-semibold text-ink">Basic info</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Title *</label>
            <input
              className={inputClass}
              value={values.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (!isEdit && !values.slug) set("slug", slugify(e.target.value));
              }}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Slug</label>
            <input className={inputClass} value={values.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated from title" />
          </div>
          <div>
            <label className={labelClass}>SKU *</label>
            <input className={inputClass} value={values.sku} onChange={(e) => set("sku", e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Part number *</label>
            <input className={inputClass} value={values.partNumber} onChange={(e) => set("partNumber", e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Manufacturer number</label>
            <input className={inputClass} value={values.manufacturerNumber} onChange={(e) => set("manufacturerNumber", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>OEM numbers (comma-separated)</label>
            <input className={inputClass} value={values.oemNumbers} onChange={(e) => set("oemNumbers", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Brand *</label>
            <select className={inputClass} value={values.brandId} onChange={(e) => set("brandId", e.target.value)} required>
              <option value="">Select brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Category *</label>
            <select className={inputClass} value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)} required>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="mb-4 font-display text-sm font-semibold text-ink">Description</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Short description</label>
            <input className={inputClass} value={values.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Full description</label>
            <textarea className={`${inputClass} min-h-28`} value={values.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="mb-4 font-display text-sm font-semibold text-ink">Pricing & stock</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className={labelClass}>Price (EUR) *</label>
            <input type="number" step="0.01" min="0" className={inputClass} value={values.priceEur} onChange={(e) => set("priceEur", e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Discount price (EUR)</label>
            <input type="number" step="0.01" min="0" className={inputClass} value={values.discountPriceEur} onChange={(e) => set("discountPriceEur", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Stock quantity</label>
            <input type="number" min="0" className={inputClass} value={values.stockQuantity} onChange={(e) => set("stockQuantity", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Low stock threshold</label>
            <input type="number" min="0" className={inputClass} value={values.lowStockThreshold} onChange={(e) => set("lowStockThreshold", e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={values.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={values.isActive} onChange={(e) => set("isActive", e.target.checked)} />
            Active (visible on storefront)
          </label>
        </div>
      </div>

      {!isEdit && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 font-display text-sm font-semibold text-ink">Images</h2>

          <div className="mb-5">
            <label className={labelClass}>Upload photos</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50"
            >
              <Upload size={16} /> Choose photos from phone
            </button>
            {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}

            {pendingUploads.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {pendingUploads.map((p) => (
                  <div key={p.id} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
                    {p.status === "uploading" ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Loader2 size={18} className="animate-spin text-white" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-red-600/85 p-1 text-center">
                        <span className="text-[9px] leading-tight text-white">Failed</span>
                        <button
                          type="button"
                          onClick={() => dismissPendingUpload(p.id)}
                          className="rounded-full bg-white/20 p-0.5 text-white hover:bg-white/40"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-2 flex items-center justify-between">
            <label className={labelClass}>Added images</label>
            <button
              type="button"
              onClick={() => set("images", [...values.images, { url: "", altText: "" }])}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-slate-50"
            >
              <Plus size={14} /> Add image URL
            </button>
          </div>
          <div className="space-y-2">
            {values.images.map((img, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {img.url && (
                    <img
                      src={img.url}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                      }}
                    />
                  )}
                </div>
                <input
                  className={inputClass}
                  placeholder="Image URL"
                  value={img.url}
                  onChange={(e) => {
                    const next = [...values.images];
                    next[i] = { ...next[i], url: e.target.value };
                    set("images", next);
                  }}
                />
                <input
                  className={inputClass}
                  placeholder="Alt text"
                  value={img.altText}
                  onChange={(e) => {
                    const next = [...values.images];
                    next[i] = { ...next[i], altText: e.target.value };
                    set("images", next);
                  }}
                />
                <button
                  type="button"
                  onClick={() => set("images", values.images.filter((_, idx) => idx !== i))}
                  className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove image"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {values.images.length === 0 && <p className="text-sm text-ink-soft">No images added yet.</p>}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push("/admin/products")} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-ink-soft hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-dark disabled:opacity-60">
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
