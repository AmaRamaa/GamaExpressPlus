"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Play, Square } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";

interface DraftProduct {
  id: string;
  title: string;
  images: { url: string }[];
}

export default function CompleteDraftsPage() {
  const token = useAdminStore((s) => s.token);
  const [products, setProducts] = useState<DraftProduct[] | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState(0);
  const [currentLabel, setCurrentLabel] = useState("");
  const stopRef = useRef(false);

  function load() {
    setError("");
    api
      .get<DraftProduct[]>("/admin/products/all-drafts", token)
      .then(setProducts)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load products"));
  }

  useEffect(load, [token]);

  // Nothing to analyze without at least one photo -- these stay pending
  // until someone adds a photo (or edits the product themselves).
  const pending = (products ?? []).filter((p) => p.images.length > 0);
  const noPhotoCount = (products ?? []).length - pending.length;

  async function start() {
    if (!products) return;
    stopRef.current = false;
    setRunning(true);
    setDone(0);
    setFailed(0);

    // Sequential -- real Anthropic API calls, same reasoning as the other bulk AI tools.
    for (const product of pending) {
      if (stopRef.current) break;
      setCurrentLabel(product.title);
      try {
        await api.post(`/products/${product.id}/auto-complete`, {}, token);
        setProducts((prev) => (prev ?? []).filter((p) => p.id !== product.id));
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
          <Sparkles size={22} className="text-brand-red" /> Bulk draft completion
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Fills in a title, brand, category, and short description for products still marked{" "}
          <span className="part-code">[Draft]</span> from staff fast-entry, using AI photo analysis and applying its
          top suggestion directly. Completed products are marked <span className="part-code">[AI]</span> and stay
          inactive until an admin reviews and saves them — this only ever touches products no admin has opened yet;
          saving a draft from its edit page removes it from this list immediately, even without changing the title.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {!products && !error && <p className="text-sm text-ink-soft">Loading…</p>}

      {products && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm text-ink">
            <span className="font-semibold">{pending.length}</span> draft{pending.length === 1 ? "" : "s"} ready to
            complete.
            {noPhotoCount > 0 && ` ${noPhotoCount} more still need a photo before AI can look at them.`}
          </p>

          {running && (
            <div className="mt-3 space-y-1">
              <p className="text-xs text-ink-soft">Completing: {currentLabel}</p>
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
              Last run: {done} completed, {failed} failed.
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
