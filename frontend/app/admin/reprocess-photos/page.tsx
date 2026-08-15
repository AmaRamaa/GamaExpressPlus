"use client";

import { useEffect, useRef, useState } from "react";
import { Wand2, Play, Square } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import { removeBackgroundFromUrl } from "@/lib/imageProcessing";

interface Img { url: string; originalUrl: string | null; altText: string | null; sortOrder: number }
interface ProductWithImages { id: string; title: string; images: Img[] }

interface PendingItem {
  productId: string;
  productTitle: string;
  imageIndex: number; // index into that product's images array
}

export default function ReprocessPhotosPage() {
  const token = useAdminStore((s) => s.token);
  const [products, setProducts] = useState<ProductWithImages[] | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState(0);
  const [currentLabel, setCurrentLabel] = useState("");
  const stopRef = useRef(false);

  function load() {
    setError("");
    api
      .get<ProductWithImages[]>("/admin/products/all-images", token)
      .then(setProducts)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load products"));
  }

  useEffect(load, [token]);

  const pending: PendingItem[] = (products ?? []).flatMap((p) =>
    p.images
      .map((img, i) => ({ img, i }))
      .filter(({ img }) => !img.originalUrl)
      .map(({ i }) => ({ productId: p.id, productTitle: p.title, imageIndex: i }))
  );

  async function start() {
    if (!products) return;
    stopRef.current = false;
    setRunning(true);
    setDone(0);
    setFailed(0);

    // Sequential on purpose -- background removal runs a real ML model
    // (WASM) in this browser tab, so processing more than one photo at a
    // time would just contend for the same CPU/GPU with no real speedup,
    // and makes the "Stop" button responsive between photos.
    for (const item of pending) {
      if (stopRef.current) break;
      const product = products.find((p) => p.id === item.productId);
      const img = product?.images[item.imageIndex];
      if (!product || !img) continue;

      setCurrentLabel(product.title);
      try {
        const blob = await removeBackgroundFromUrl(img.url);
        const formData = new FormData();
        formData.append("file", new File([blob], "no-bg.jpg", { type: "image/jpeg" }));
        const uploaded = await api.upload<{ url: string }>("/uploads", formData, token);

        const nextImages = product.images.map((im, i) =>
          i === item.imageIndex ? { ...im, url: uploaded.url, originalUrl: im.originalUrl || im.url } : im
        );
        await api.put(
          `/products/${product.id}`,
          {
            images: {
              create: nextImages.map((im, i) => ({
                url: im.url,
                originalUrl: im.originalUrl || undefined,
                altText: im.altText || undefined,
                sortOrder: i,
              })),
            },
          },
          token
        );

        // Reflect the change locally so a re-render shows accurate progress
        // and so this photo isn't reprocessed if the run continues.
        setProducts((prev) =>
          (prev ?? []).map((p) => (p.id === product.id ? { ...p, images: nextImages } : p))
        );
        setDone((n) => n + 1);
      } catch {
        setFailed((n) => n + 1);
      }
    }

    setRunning(false);
    setCurrentLabel("");
  }

  function stop() {
    stopRef.current = true;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
          <Wand2 size={22} className="text-brand-red" /> Bulk background removal
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Strips the background from every product photo that hasn't been processed yet, replacing it with a
          clean white background. Runs entirely in this browser tab (free, no API key) -- keep this tab open
          while it works. Non-destructive: the original photo is kept and can be restored per-photo from the
          product's edit page. Safe to stop and re-run later -- already-processed photos are always skipped.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {!products && !error && <p className="text-sm text-ink-soft">Loading…</p>}

      {products && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm text-ink">
            <span className="font-semibold">{pending.length}</span> photo{pending.length === 1 ? "" : "s"} still need
            processing, out of {products.reduce((n, p) => n + p.images.length, 0)} total.
          </p>

          {running && (
            <div className="mt-3 space-y-1">
              <p className="text-xs text-ink-soft">Processing: {currentLabel}</p>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-brand-red transition-all"
                  style={{ width: `${((done + failed) / Math.max(pending.length, 1)) * 100}%` }}
                />
              </div>
              <p className="text-xs text-ink-soft">{done + failed} / {pending.length} ({failed} failed)</p>
            </div>
          )}

          {!running && (done > 0 || failed > 0) && (
            <p className="mt-3 text-sm text-ink-soft">
              Last run: {done} processed, {failed} failed.
            </p>
          )}

          <div className="mt-4 flex gap-2">
            {!running ? (
              <button
                type="button"
                onClick={start}
                disabled={pending.length === 0}
                className="flex items-center gap-1.5 rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-dark disabled:opacity-50"
              >
                <Play size={15} /> Start
              </button>
            ) : (
              <button
                type="button"
                onClick={stop}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50"
              >
                <Square size={15} /> Stop
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
