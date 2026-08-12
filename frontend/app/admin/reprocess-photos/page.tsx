"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import { processImage } from "@/lib/imageProcessing";

interface ImageRow { url: string; altText: string | null; sortOrder: number }
interface ProductListItem { id: string }
interface ProductDetail { id: string; title: string; sku: string; images: ImageRow[] }
interface ListResponse { items: ProductListItem[]; totalPages: number }

interface LogEntry {
  productId: string;
  label: string;
  status: "working" | "done" | "skipped" | "error";
  detail?: string;
}

export default function ReprocessPhotosPage() {
  const router = useRouter();
  const token = useAdminStore((s) => s.token);
  const user = useAdminStore((s) => s.user);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);

  if (user?.role === "STAFF_PIN") {
    return (
      <div className="max-w-lg">
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">This tool is only available to full admin accounts.</p>
        <button onClick={() => router.push("/admin/products")} className="mt-3 text-sm text-brand-red hover:underline">Back to products</button>
      </div>
    );
  }

  function updateLog(productId: string, patch: Partial<LogEntry>) {
    setLog((prev) => prev.map((l) => (l.productId === productId ? { ...l, ...patch } : l)));
  }

  async function fetchAllProductIds(): Promise<string[]> {
    const ids: string[] = [];
    let page = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const res = await api.get<ListResponse>(`/admin/products?limit=100&page=${page}`, token);
      ids.push(...res.items.map((p) => p.id));
      if (page >= res.totalPages) break;
      page++;
    }
    return ids;
  }

  async function run() {
    setRunning(true);
    setLog([]);
    setDone(0);
    try {
      const ids = await fetchAllProductIds();
      setTotal(ids.length);
      for (const id of ids) {
        const entry: LogEntry = { productId: id, label: id, status: "working" };
        setLog((prev) => [...prev, entry]);
        try {
          const product = await api.get<ProductDetail>(`/admin/products/${id}`, token);
          updateLog(id, { label: `${product.title} (${product.sku})` });

          if (!product.images || product.images.length === 0) {
            updateLog(id, { status: "skipped", detail: "no photos" });
            setDone((d) => d + 1);
            continue;
          }

          const newImages: ImageRow[] = [];
          for (let i = 0; i < product.images.length; i++) {
            const img = product.images[i];
            const res = await fetch(img.url);
            const blob = await res.blob();
            const file = new File([blob], `photo-${i}.jpg`, { type: blob.type || "image/jpeg" });
            const processed = await processImage(file, { removeBg: true, watermark: true });
            const formData = new FormData();
            formData.append("file", processed, `photo-${i}.jpg`);
            const uploaded = await api.upload<{ url: string }>("/uploads", formData, token);
            newImages.push({ url: uploaded.url, altText: img.altText, sortOrder: i });
          }

          await api.put(
            `/products/${id}`,
            { images: { create: newImages.map((img) => ({ url: img.url, altText: img.altText || undefined, sortOrder: img.sortOrder })) } },
            token
          );
          updateLog(id, { status: "done", detail: `${newImages.length} photo(s)` });
        } catch (err) {
          updateLog(id, { status: "error", detail: err instanceof ApiError ? err.message : "Failed" });
        }
        setDone((d) => d + 1);
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not load products");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Reprocess all photos</h1>
        <p className="text-sm text-ink-soft">
          Runs background removal + watermark on every existing product photo and replaces it, one product at a
          time. This can take a while (several seconds per photo) and re-uploads a new file for each one -- keep
          this tab open while it runs.
        </p>
      </div>

      {!running && log.length === 0 && (
        <button
          onClick={run}
          className="flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-red-dark"
        >
          <Wand2 size={16} /> Start reprocessing
        </button>
      )}

      {(running || log.length > 0) && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium text-ink">{done} / {total || "…"} products</span>
            {running && <Loader2 size={16} className="animate-spin text-brand-red" />}
          </div>
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {log.map((entry) => (
              <div key={entry.productId} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs">
                {entry.status === "working" && <Loader2 size={13} className="shrink-0 animate-spin text-slate-400" />}
                {entry.status === "done" && <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />}
                {entry.status === "skipped" && <CheckCircle2 size={13} className="shrink-0 text-slate-300" />}
                {entry.status === "error" && <XCircle size={13} className="shrink-0 text-red-500" />}
                <span className="truncate text-ink">{entry.label}</span>
                {entry.detail && <span className="shrink-0 text-ink-soft">— {entry.detail}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!running && log.length > 0 && (
        <button onClick={run} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50">
          Run again
        </button>
      )}
    </div>
  );
}
