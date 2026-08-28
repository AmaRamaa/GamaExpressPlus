"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, Loader2, X, RotateCcw, RotateCw, Download, Car, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Eraser, Undo2, Sparkles, Check } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import VehicleAutocomplete, { type VehicleSearchEntry } from "@/components/VehicleAutocomplete";
import { removeBackgroundFromUrl } from "@/lib/imageProcessing";

interface Brand { id: string; name: string }
interface Category { id: string; name: string }
interface Manufacturer { id: string; name: string }
interface ImageRow { url: string; altText: string; originalUrl?: string }
interface CompatibilityRow { engineId: string; generationId: string; label: string }
interface PendingUpload {
  id: string;
  previewUrl: string;
  fileName: string;
  status: "uploading" | "error";
  errorMessage?: string;
}
interface VehicleMake { id: string; name: string }
interface VehicleModel { id: string; name: string }
interface VehicleGeneration { id: string; name: string; yearFrom: number; yearTo: number | null }
interface VehicleEngine { id: string; engineCode: string; displacementL: number; fuelType: string; horsePowerHp: number }
interface AiSuggestion {
  title: string;
  brand: string;
  category: string;
  shortDescription: string;
  vehicleCompatibilityGuess: string;
  vehicleConfidence: "low" | "medium" | "high";
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
  isFeatured: boolean;
  isActive: boolean;
  images: ImageRow[];
  compatibility: CompatibilityRow[];
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
  isFeatured: false,
  isActive: true,
  images: [],
  compatibility: [],
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-red";
const labelClass = "mb-1 block text-xs font-medium text-ink-soft";

export function ProductForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Partial<ProductFormValues>;
  // Defaults to navigating to /admin/products, matching the dedicated
  // create/edit admin pages. Pass these when embedding the form elsewhere
  // (e.g. an inline-edit modal on the storefront) so it doesn't navigate
  // the admin away from the page they were just looking at.
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const token = useAdminStore((s) => s.token);
  const user = useAdminStore((s) => s.user);
  const [values, setValues] = useState<ProductFormValues>({ ...EMPTY, ...initial });
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [justCreatedSku, setJustCreatedSku] = useState("");
  const [justCreatedPartNumber, setJustCreatedPartNumber] = useState("");
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [rotatingUrl, setRotatingUrl] = useState<string | null>(null);
  const [bgRemovingUrl, setBgRemovingUrl] = useState<string | null>(null);
  const [bulkBgRunning, setBulkBgRunning] = useState(false);
  const [bulkBgDone, setBulkBgDone] = useState(0);
  const [bulkBgFailed, setBulkBgFailed] = useState(0);
  const [bulkBgTotal, setBulkBgTotal] = useState(0);
  const bulkBgStopRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadsRef = useRef<PendingUpload[]>([]);

  const [vMakes, setVMakes] = useState<VehicleMake[]>([]);
  const [vModels, setVModels] = useState<VehicleModel[]>([]);
  const [vGenerations, setVGenerations] = useState<VehicleGeneration[]>([]);
  const [vEngines, setVEngines] = useState<VehicleEngine[]>([]);
  const [vMakeId, setVMakeId] = useState("");
  const [vModelId, setVModelId] = useState("");
  const [vGenerationId, setVGenerationId] = useState("");

  const isEdit = !!values.id;
  const isStaffFastEntry = user?.role === "STAFF_PIN" && !isEdit;
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    api.get<Brand[]>("/catalog/brands").then(setBrands).catch(() => {});
    api.get<Category[]>("/catalog/categories?includeInternal=true").then(setCategories).catch(() => {});
    api.get<Manufacturer[]>("/catalog/manufacturers").then(setManufacturers).catch(() => {});
    if (isAdmin) api.get<VehicleMake[]>("/vehicles/makes").then(setVMakes).catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    if (!vMakeId) { setVModels([]); return; }
    api.get<VehicleModel[]>(`/vehicles/makes/${vMakeId}/models`).then(setVModels).catch(() => setVModels([]));
  }, [vMakeId]);

  useEffect(() => {
    if (!vModelId) { setVGenerations([]); return; }
    api.get<VehicleGeneration[]>(`/vehicles/models/${vModelId}/generations`).then(setVGenerations).catch(() => setVGenerations([]));
  }, [vModelId]);

  useEffect(() => {
    if (!vGenerationId) { setVEngines([]); return; }
    api.get<VehicleEngine[]>(`/vehicles/generations/${vGenerationId}/engines`).then(setVEngines).catch(() => setVEngines([]));
  }, [vGenerationId]);

  // We don't track engine-specific fitment -- the storefront's own vehicle
  // search only ever filters by generation (`compatibility.some(engine.generationId)`),
  // so linking to any one engine in the chosen generation is enough for the
  // part to show up correctly. Picking the first one keeps the admin picker
  // to Make/Model/Generation, matching how fitment is actually tracked here.
  function addCompatibility() {
    const make = vMakes.find((m) => m.id === vMakeId);
    const model = vModels.find((m) => m.id === vModelId);
    const generation = vGenerations.find((g) => g.id === vGenerationId);
    const engine = vEngines[0];
    if (!make || !model || !generation || !engine) return;
    if (values.compatibility.some((c) => c.generationId === generation.id)) return;
    const label = `${make.name} ${model.name} ${generation.name} (${generation.yearFrom}–${generation.yearTo ?? "present"})`;
    set("compatibility", [...values.compatibility, { engineId: engine.id, generationId: generation.id, label }]);
    setVMakeId(""); setVModelId(""); setVGenerationId("");
  }

  // Same as addCompatibility, but for a generation picked directly from the
  // typeahead -- fetches (and self-heals a placeholder for) its engine
  // instead of relying on the cascading selects being populated.
  async function addCompatibilityFromAutocomplete(entry: VehicleSearchEntry) {
    if (values.compatibility.some((c) => c.generationId === entry.generationId)) return;
    try {
      const engines = await api.get<{ id: string }[]>(`/vehicles/generations/${entry.generationId}/engines`);
      const engine = engines[0];
      if (!engine) return;
      const label = `${entry.makeName} ${entry.modelName} ${entry.generationName} (${entry.yearFrom}–${entry.yearTo ?? "present"})`;
      set("compatibility", [...values.compatibility, { engineId: engine.id, generationId: entry.generationId, label }]);
    } catch {
      setError("Could not add that vehicle -- try again.");
    }
  }

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
      formData.append("file", file, file.name);
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

  // Rotates a photo for real (not just a CSS transform) by redrawing it onto a
  // rotated canvas, re-uploading the result to Storage, and swapping the URL
  // in place -- so the fix actually shows up for customers, not just in admin.
  async function rotateImage(index: number, degrees: 90 | -90) {
    const img = values.images[index];
    if (!img || rotatingUrl) return;
    setRotatingUrl(img.url);
    setError("");
    try {
      const source = new Image();
      source.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        source.onload = () => resolve();
        source.onerror = () => reject(new Error("Could not load image for rotating"));
        source.src = img.url;
      });
      const canvas = document.createElement("canvas");
      const swapDims = Math.abs(degrees) === 90;
      canvas.width = swapDims ? source.naturalHeight : source.naturalWidth;
      canvas.height = swapDims ? source.naturalWidth : source.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(source, -source.naturalWidth / 2, -source.naturalHeight / 2);

      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not export rotated image"))), "image/jpeg", 0.92)
      );
      const formData = new FormData();
      formData.append("file", new File([blob], "rotated.jpg", { type: "image/jpeg" }));
      const data = await api.upload<{ url: string }>("/uploads", formData, token);

      setValues((v) => {
        const next = [...v.images];
        next[index] = { ...next[index], url: data.url };
        return { ...v, images: next };
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not rotate this photo -- it may be blocking cross-origin access.");
    } finally {
      setRotatingUrl(null);
    }
  }

  // Non-destructive: the pre-removal photo is uploaded as-is to Storage and
  // kept as originalUrl, never overwritten, so "Restore original" can always
  // get back to exactly what was there before -- the AI pass can't
  // permanently damage a photo.
  async function removeBackgroundFromImage(index: number) {
    const img = values.images[index];
    if (!img || bgRemovingUrl) return;
    setBgRemovingUrl(img.url);
    setError("");
    try {
      const blob = await removeBackgroundFromUrl(img.url);
      const formData = new FormData();
      formData.append("file", new File([blob], "no-bg.jpg", { type: "image/jpeg" }));
      const data = await api.upload<{ url: string }>("/uploads", formData, token);
      setValues((v) => {
        const next = [...v.images];
        next[index] = { ...next[index], url: data.url, originalUrl: img.originalUrl || img.url };
        return { ...v, images: next };
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove the background from this photo.");
    } finally {
      setBgRemovingUrl(null);
    }
  }

  function restoreOriginalImage(index: number) {
    setValues((v) => {
      const next = [...v.images];
      const original = next[index].originalUrl;
      if (!original) return v;
      next[index] = { ...next[index], url: original, originalUrl: undefined };
      return { ...v, images: next };
    });
  }

  // Runs the same non-destructive removal as the single-photo button across
  // every photo on this product that hasn't been processed yet. Sequential
  // (same WASM-in-the-browser reasoning as the site-wide bulk tool), and
  // stoppable mid-run -- clicking the button again afterward just continues
  // with whatever's still unprocessed, since already-done photos are
  // identified by having an originalUrl and get skipped.
  const bulkBgPending = values.images.filter((img) => img.url && !img.originalUrl).length;

  async function startBulkRemoveBackground() {
    if (bulkBgRunning) return;
    const items = values.images
      .map((img, i) => ({ index: i, url: img.url }))
      .filter((item) => item.url && !values.images[item.index].originalUrl);
    if (items.length === 0) return;

    bulkBgStopRef.current = false;
    setBulkBgRunning(true);
    setBulkBgDone(0);
    setBulkBgFailed(0);
    setBulkBgTotal(items.length);
    setError("");

    for (const item of items) {
      if (bulkBgStopRef.current) break;
      setBgRemovingUrl(item.url);
      try {
        const blob = await removeBackgroundFromUrl(item.url);
        const formData = new FormData();
        formData.append("file", new File([blob], "no-bg.jpg", { type: "image/jpeg" }));
        const data = await api.upload<{ url: string }>("/uploads", formData, token);
        setValues((v) => {
          const next = [...v.images];
          const current = next[item.index];
          if (!current || current.url !== item.url) return v;
          next[item.index] = { ...current, url: data.url, originalUrl: current.originalUrl || item.url };
          return { ...v, images: next };
        });
        setBulkBgDone((n) => n + 1);
      } catch {
        setBulkBgFailed((n) => n + 1);
      }
    }

    setBgRemovingUrl(null);
    setBulkBgRunning(false);
  }

  function stopBulkRemoveBackground() {
    bulkBgStopRef.current = true;
  }

  async function analyzePhotos() {
    const imageUrls = values.images.map((i) => i.url.trim()).filter(Boolean).slice(0, 4);
    if (imageUrls.length === 0) return;
    setAiLoading(true);
    setAiError("");
    setAiSuggestion(null);
    try {
      const suggestion = await api.post<AiSuggestion>("/products/analyze-photos", { imageUrls }, token);
      setAiSuggestion(suggestion);
    } catch (err) {
      setAiError(err instanceof ApiError ? err.message : "AI analysis failed.");
    } finally {
      setAiLoading(false);
    }
  }

  function findBrandByName(name: string) {
    return brands.find((b) => b.name.toLowerCase() === name.trim().toLowerCase());
  }

  function findCategoryByName(name: string) {
    return categories.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
  }

  async function downloadImage(url: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = url.split("/").pop() || "photo.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank");
    }
  }

  function dismissPendingUpload(id: string) {
    setPendingUploads((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  // The array order IS the ranking -- saved as each image's sortOrder on submit.
  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= values.images.length) return;
    const next = [...values.images];
    [next[index], next[target]] = [next[target], next[index]];
    set("images", next);
  }

  function slugify(s: string) {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function handleFastEntrySubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setJustCreatedSku("");
    setJustCreatedPartNumber("");

    if (!values.sku.trim()) {
      setError("SKU is required.");
      return;
    }
    if (pendingUploads.some((p) => p.status === "uploading")) {
      setError("Wait for photos to finish uploading first.");
      return;
    }

    const staffName = localStorage.getItem("gama-express-staff-name") || undefined;
    const payload = {
      sku: values.sku.trim(),
      description: values.description.trim() || undefined,
      images: {
        create: values.images
          .filter((img) => img.url.trim())
          .map((img, i) => ({ url: img.url.trim(), sortOrder: i })),
      },
      ...(staffName ? { staffName } : {}),
    };

    setSaving(true);
    try {
      const created = await api.post<{ partNumber: string }>("/products", payload, token);
      setJustCreatedSku(values.sku.trim());
      setJustCreatedPartNumber(created.partNumber || "");
      setValues({ ...EMPTY });
      setPendingUploads([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const stockQuantity = Number(values.stockQuantity) || 0;
    // No more configurable low-stock buffer -- a product is either in stock
    // or it isn't.
    const stockStatus = stockQuantity === 0 ? "OUT_OF_STOCK" : "IN_STOCK";

    const payload = {
      sku: values.sku.trim() || undefined,
      slug: values.slug.trim() || (values.sku.trim() ? slugify(values.sku) : undefined),
      title: values.title.trim() || undefined,
      shortDescription: values.shortDescription.trim() || undefined,
      description: values.description.trim() || undefined,
      categoryId: values.categoryId || undefined,
      brandId: values.brandId || undefined,
      manufacturerId: values.manufacturerId || null,
      partNumber: values.partNumber.trim() || undefined,
      manufacturerNumber: values.manufacturerNumber.trim() || undefined,
      oemNumbers: values.oemNumbers.split(",").map((s) => s.trim()).filter(Boolean),
      priceEur: values.priceEur.trim() ? Number(values.priceEur) : undefined,
      discountPriceEur: values.discountPriceEur.trim() ? Number(values.discountPriceEur) : undefined,
      stockQuantity,
      stockStatus,
      isFeatured: values.isFeatured,
      isActive: values.isActive,
      images: {
        create: values.images
          .filter((img) => img.url.trim())
          .map((img, i) => ({ url: img.url.trim(), originalUrl: img.originalUrl, altText: img.altText.trim() || undefined, sortOrder: i })),
      },
      compatibility: {
        create: values.compatibility.map((c) => ({ engineId: c.engineId })),
      },
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/products/${values.id}`, payload, token);
      } else {
        const staffName = localStorage.getItem("gama-express-staff-name") || undefined;
        await api.post("/products", { ...payload, ...(staffName ? { staffName } : {}) }, token);
      }
      if (onSaved) onSaved();
      else router.push("/admin/products");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  if (isStaffFastEntry) {
    return (
      <form onSubmit={handleFastEntrySubmit} className="space-y-6">
        {justCreatedSku && (
          <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
            Added "{justCreatedSku}"{justCreatedPartNumber ? <> — part number <span className="part-code font-semibold">{justCreatedPartNumber}</span></> : null}. An admin will fill in the details later — keep going.
          </p>
        )}
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 font-display text-sm font-semibold text-ink">Product</h2>
          <label className={labelClass}>SKU *</label>
          <input
            className={inputClass}
            value={values.sku}
            onChange={(e) => set("sku", e.target.value)}
            placeholder="Scan or type the SKU"
            autoFocus
            required
          />
          <label className={`${labelClass} mt-4`}>Description</label>
          <textarea
            className={`${inputClass} min-h-24`}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Optional notes about this part"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 font-display text-sm font-semibold text-ink">Photos</h2>
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

          {(pendingUploads.length > 0 || values.images.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {values.images.map((img, i) => (
                <div key={img.url + i} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => set("images", values.images.filter((_, idx) => idx !== i))}
                    aria-label="Remove photo"
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
                  >
                    <X size={12} />
                  </button>
                  {values.images.length > 1 && (
                    <div className="absolute inset-x-0 bottom-0 flex justify-center gap-0.5 bg-black/50 py-0.5">
                      <button
                        type="button"
                        onClick={() => moveImage(i, -1)}
                        disabled={i === 0}
                        aria-label="Move photo earlier"
                        className="rounded p-0.5 text-white hover:bg-white/20 disabled:opacity-30"
                      >
                        <ArrowLeft size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(i, 1)}
                        disabled={i === values.images.length - 1}
                        aria-label="Move photo later"
                        className="rounded p-0.5 text-white hover:bg-white/20 disabled:opacity-30"
                      >
                        <ArrowRight size={11} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {pendingUploads.map((p) => (
                <div key={p.id} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
                  {p.status === "error" ? (
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
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50">
                      <Loader2 size={18} className="animate-spin text-white" />
                      <span className="text-[8px] leading-tight text-white">Uploading…</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => (onCancel ? onCancel() : router.push("/admin/products"))} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-ink-soft hover:bg-slate-50">
            Done for now
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-dark disabled:opacity-60">
            {saving ? "Saving…" : "Add & next"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="mb-4 font-display text-sm font-semibold text-ink">Basic info</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Title</label>
            <input
              className={inputClass}
              value={values.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (!isEdit && !values.slug) set("slug", slugify(e.target.value));
              }}
            />
          </div>
          <div>
            <label className={labelClass}>Slug</label>
            <input className={inputClass} value={values.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated from title" />
          </div>
          <div>
            <label className={labelClass}>SKU</label>
            <input className={inputClass} value={values.sku} onChange={(e) => set("sku", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Part number</label>
            <input className={inputClass} value={values.partNumber} onChange={(e) => set("partNumber", e.target.value)} />
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
            <label className={labelClass}>Brand</label>
            <select className={inputClass} value={values.brandId} onChange={(e) => set("brandId", e.target.value)}>
              <option value="">Select brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select className={inputClass} value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Manufacturer</label>
            <select className={inputClass} value={values.manufacturerId} onChange={(e) => set("manufacturerId", e.target.value)}>
              <option value="">Select manufacturer (optional)</option>
              {manufacturers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Price (EUR)</label>
            <input type="number" step="0.01" min="0" className={inputClass} value={values.priceEur} onChange={(e) => set("priceEur", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Discount price (EUR)</label>
            <input type="number" step="0.01" min="0" className={inputClass} value={values.discountPriceEur} onChange={(e) => set("discountPriceEur", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Stock quantity</label>
            <input type="number" min="0" className={inputClass} value={values.stockQuantity} onChange={(e) => set("stockQuantity", e.target.value)} />
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

      {(
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
                  <div key={p.id} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
                    {p.status === "error" ? (
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
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50">
                        <Loader2 size={18} className="animate-spin text-white" />
                        <span className="text-[8px] leading-tight text-white">Uploading…</span>
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

          {isAdmin && values.images.length > 1 && (bulkBgPending > 0 || bulkBgRunning) && (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <Eraser size={14} className="shrink-0 text-ink-soft" />
              <span className="text-xs text-ink-soft">
                {bulkBgRunning
                  ? `Removing backgrounds… ${bulkBgDone + bulkBgFailed}/${bulkBgTotal}${bulkBgFailed ? ` (${bulkBgFailed} failed)` : ""}`
                  : `${bulkBgPending} photo${bulkBgPending === 1 ? "" : "s"} without a clean background`}
              </span>
              <div className="ml-auto">
                {bulkBgRunning ? (
                  <button
                    type="button"
                    onClick={stopBulkRemoveBackground}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-slate-100"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startBulkRemoveBackground}
                    disabled={!!bgRemovingUrl}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-slate-100 disabled:opacity-50"
                  >
                    {bulkBgDone > 0 || bulkBgFailed > 0 ? "Continue" : `Remove all backgrounds (${bulkBgPending})`}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {values.images.map((img, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
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
                  {(rotatingUrl === img.url || bgRemovingUrl === img.url) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 size={14} className="animate-spin text-white" />
                    </div>
                  )}
                </div>
                {values.images.length > 1 && (
                  <div className="flex shrink-0 flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveImage(i, -1)}
                      disabled={i === 0}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-ink disabled:opacity-30"
                      aria-label="Move photo up"
                      title="Move up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(i, 1)}
                      disabled={i === values.images.length - 1}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-ink disabled:opacity-30"
                      aria-label="Move photo down"
                      title="Move down"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                )}
                {isAdmin && img.url && (
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => rotateImage(i, -90)}
                      disabled={!!rotatingUrl}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-ink disabled:opacity-40"
                      aria-label="Rotate left"
                      title="Rotate left"
                    >
                      <RotateCcw size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => rotateImage(i, 90)}
                      disabled={!!rotatingUrl}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-ink disabled:opacity-40"
                      aria-label="Rotate right"
                      title="Rotate right"
                    >
                      <RotateCw size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadImage(img.url)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-ink"
                      aria-label="Download photo"
                      title="Download"
                    >
                      <Download size={15} />
                    </button>
                    {img.originalUrl ? (
                      <button
                        type="button"
                        onClick={() => restoreOriginalImage(i)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-ink"
                        aria-label="Restore original photo"
                        title="Restore original"
                      >
                        <Undo2 size={15} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeBackgroundFromImage(i)}
                        disabled={!!bgRemovingUrl}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-ink disabled:opacity-40"
                        aria-label="Remove background"
                        title="Remove background"
                      >
                        <Eraser size={15} />
                      </button>
                    )}
                  </div>
                )}
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

      {isAdmin && values.images.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-ink">
              <Sparkles size={16} className="text-brand-red" /> AI suggestions
            </h2>
            <button
              type="button"
              onClick={analyzePhotos}
              disabled={aiLoading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-ink hover:bg-slate-50 disabled:opacity-60"
            >
              {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {aiLoading ? "Analyzing…" : aiSuggestion ? "Re-analyze photos" : "Analyze photos with AI"}
            </button>
          </div>
          <p className="mb-3 text-xs text-ink-soft">
            Looks at the photos and suggests Title, Brand, Category, and a short description -- compare against
            what's entered and apply whichever you want, field by field.
          </p>

          {aiError && <p className="mb-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600">{aiError}</p>}

          {aiSuggestion && (
            <div className="space-y-2.5">
              {([
                { key: "title", label: "Title", aiValue: aiSuggestion.title, apply: () => set("title", aiSuggestion.title) },
                {
                  key: "brand",
                  label: "Brand",
                  aiValue: aiSuggestion.brand,
                  apply: () => {
                    const match = findBrandByName(aiSuggestion.brand);
                    if (match) set("brandId", match.id);
                  },
                  disabled: !findBrandByName(aiSuggestion.brand),
                  note: !findBrandByName(aiSuggestion.brand) ? "Not in your Brands list yet" : undefined,
                },
                {
                  key: "category",
                  label: "Category",
                  aiValue: aiSuggestion.category,
                  apply: () => {
                    const match = findCategoryByName(aiSuggestion.category);
                    if (match) set("categoryId", match.id);
                  },
                  disabled: !findCategoryByName(aiSuggestion.category),
                  note: !findCategoryByName(aiSuggestion.category) ? "Not in your Categories list yet" : undefined,
                },
                {
                  key: "shortDescription",
                  label: "Short description",
                  aiValue: aiSuggestion.shortDescription,
                  apply: () => set("shortDescription", aiSuggestion.shortDescription),
                },
              ] as const).map((field) => (
                <div key={field.key} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">{field.label}</p>
                    <p className="truncate text-sm text-ink">{field.aiValue || "—"}</p>
                    {"note" in field && field.note && <p className="text-[11px] text-amber-600">{field.note}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={field.apply}
                    disabled={"disabled" in field && field.disabled}
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-slate-100 disabled:opacity-40"
                  >
                    <Check size={12} /> Use this
                  </button>
                </div>
              ))}

              <div className="rounded-lg bg-amber-50 p-2.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">
                  Vehicle compatibility guess ({aiSuggestion.vehicleConfidence} confidence)
                </p>
                <p className="text-sm text-amber-900">{aiSuggestion.vehicleCompatibilityGuess}</p>
                <p className="mt-1 text-[11px] text-amber-700">
                  A photo alone usually can't confirm exact fitment -- verify and add the real vehicle below.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-1 flex items-center gap-2 font-display text-sm font-semibold text-ink">
            <Car size={16} className="text-brand-red" /> Vehicle compatibility
          </h2>
          <p className="mb-4 text-xs text-ink-soft">So this part shows up when a customer searches by their vehicle.</p>

          <VehicleAutocomplete
            placeholder="Type a vehicle, e.g. Golf 7"
            onSelect={addCompatibilityFromAutocomplete}
            className="mb-3"
          />

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select className={inputClass} value={vMakeId} onChange={(e) => { setVMakeId(e.target.value); setVModelId(""); setVGenerationId(""); }}>
              <option value="">Make</option>
              {vMakes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select className={inputClass} value={vModelId} disabled={!vMakeId} onChange={(e) => { setVModelId(e.target.value); setVGenerationId(""); }}>
              <option value="">Model</option>
              {vModels.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select className={inputClass} value={vGenerationId} disabled={!vModelId} onChange={(e) => setVGenerationId(e.target.value)}>
              <option value="">Generation</option>
              {vGenerations.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.yearFrom}–{g.yearTo ?? "present"})</option>)}
            </select>
            <button
              type="button"
              onClick={addCompatibility}
              disabled={!vGenerationId || vEngines.length === 0}
              className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-sm font-medium text-ink hover:bg-slate-50 disabled:opacity-40"
            >
              <Plus size={14} /> Add
            </button>
          </div>

          <div className="mt-4 space-y-1.5">
            {values.compatibility.map((c) => (
              <div key={c.engineId} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-ink">
                <span>{c.label}</span>
                <button
                  type="button"
                  onClick={() => set("compatibility", values.compatibility.filter((x) => x.engineId !== c.engineId))}
                  className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove vehicle"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {values.compatibility.length === 0 && <p className="text-sm text-ink-soft">Universal fit — no specific vehicle assigned.</p>}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => (onCancel ? onCancel() : router.push("/admin/products"))} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-ink-soft hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-dark disabled:opacity-60">
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
