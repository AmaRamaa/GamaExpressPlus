"use client";

import { useEffect, useRef, useState } from "react";
import { Languages, Play, Square } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";

interface ProductText {
  id: string;
  title: string;
  shortDescription: string | null;
  description: string | null;
  contentLanguage: "SQ" | "EN" | null;
  titleTranslated: string | null;
  shortDescriptionTranslated: string | null;
  descriptionTranslated: string | null;
}

export default function TranslateProductsPage() {
  const token = useAdminStore((s) => s.token);
  const [products, setProducts] = useState<ProductText[] | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState(0);
  const [currentLabel, setCurrentLabel] = useState("");
  const stopRef = useRef(false);

  function load() {
    setError("");
    api
      .get<ProductText[]>("/admin/products/all-text", token)
      .then(setProducts)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load products"));
  }

  useEffect(load, [token]);

  const pending = (products ?? []).filter((p) => !p.contentLanguage && p.title?.trim() && !p.title.startsWith("[Draft]"));

  async function start() {
    if (!products) return;
    stopRef.current = false;
    setRunning(true);
    setDone(0);
    setFailed(0);

    // Sequential -- these are real Anthropic API calls (cost + rate limits),
    // same reasoning as the bulk background-removal tool for keeping Stop responsive.
    for (const product of pending) {
      if (stopRef.current) break;
      setCurrentLabel(product.title);
      try {
        const updated = await api.post<ProductText & { skipped?: boolean }>(`/products/${product.id}/translate`, {}, token);
        setProducts((prev) => (prev ?? []).map((p) => (p.id === product.id ? { ...p, ...updated } : p)));
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
          <Languages size={22} className="text-brand-red" /> Bulk product translation
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Detects whether each product's title/description is written in Albanian or English, and generates the
          counterpart in the other language so the storefront shows the right one for the visitor's chosen locale.
          Uses Claude (a few cents per 100 products). Safe to stop and re-run later — already-translated products
          are always skipped, and new/edited products are translated automatically going forward.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {!products && !error && <p className="text-sm text-ink-soft">Loading…</p>}

      {products && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm text-ink">
            <span className="font-semibold">{pending.length}</span> product{pending.length === 1 ? "" : "s"} still need
            translating, out of {products.length} total.
          </p>

          {running && (
            <div className="mt-3 space-y-1">
              <p className="text-xs text-ink-soft">Translating: {currentLabel}</p>
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
              Last run: {done} translated, {failed} failed.
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
                <Play size={15} /> {done > 0 || failed > 0 ? "Continue" : "Start"}
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
