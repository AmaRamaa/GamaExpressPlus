"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { PackagePlus, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { api, ApiError } from "@/lib/api";

interface SubmissionResult {
  status: "PENDING" | "REJECTED" | "APPROVED" | "PROMOTED";
}

const MAX_PHOTOS = 4;

export default function SellPartPage() {
  const { t } = useT();
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmissionResult | null>(null);

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...chosen].slice(0, MAX_PHOTOS));
    e.target.value = "";
  }

  function removePhoto(i: number) {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (photos.length === 0) {
      setError(t.sellPart.errorNoPhoto);
      return;
    }

    const form = new FormData(e.currentTarget);
    const fd = new FormData();
    fd.append("submitterName", String(form.get("fullName") || ""));
    fd.append("submitterEmail", String(form.get("email") || ""));
    fd.append("submitterPhone", String(form.get("phone") || ""));
    fd.append("title", String(form.get("title") || ""));
    fd.append("description", String(form.get("description") || ""));
    photos.forEach((file) => fd.append("images", file));

    setSubmitting(true);
    try {
      const res = await api.upload<SubmissionResult>("/submissions", fd);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.sellPart.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  const successCopy = result && {
    APPROVED: { title: t.sellPart.successApprovedTitle, desc: t.sellPart.successApprovedDesc },
    PENDING: { title: t.sellPart.successPendingTitle, desc: t.sellPart.successPendingDesc },
    REJECTED: { title: t.sellPart.successRejectedTitle, desc: t.sellPart.successRejectedDesc },
    PROMOTED: { title: t.sellPart.successApprovedTitle, desc: t.sellPart.successApprovedDesc },
  }[result.status];

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 text-center">
          <PackagePlus size={28} className="mx-auto mb-3 text-brand-red" />
          <h1 className="font-display text-2xl font-bold text-ink">{t.sellPart.pageTitle}</h1>
          <p className="mt-2 text-sm text-ink-soft">{t.sellPart.pageDesc}</p>
        </div>

        {successCopy ? (
          <div
            className={`rounded-xl border p-6 text-center ${
              result?.status === "REJECTED"
                ? "border-amber-300 bg-amber-50"
                : "border-success/30 bg-success-light"
            }`}
          >
            <p className={`font-semibold ${result?.status === "REJECTED" ? "text-amber-700" : "text-success"}`}>
              {successCopy.title}
            </p>
            <p className="mt-1 text-sm text-ink-soft">{successCopy.desc}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-surface-border bg-surface p-6 shadow-soft">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{t.sellPart.fullNameLabel}</label>
                <input name="fullName" required className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{t.sellPart.emailLabel}</label>
                <input name="email" required type="email" className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">{t.sellPart.phoneLabel}</label>
              <input name="phone" className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">{t.sellPart.titleLabel}</label>
              <input name="title" required placeholder={t.sellPart.titlePlaceholder} className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">{t.sellPart.descriptionLabel}</label>
              <textarea name="description" rows={4} className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">{t.sellPart.photosLabel}</label>
              <p className="mb-2 text-xs text-ink-soft">{t.sellPart.photosHint}</p>
              {photos.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {photos.map((file, i) => (
                    <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-surface-border">
                      <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        aria-label="Remove photo"
                        className="absolute right-0.5 top-0.5 rounded-full bg-ink/70 p-0.5 text-white hover:bg-ink"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {photos.length < MAX_PHOTOS && (
                <input type="file" accept="image/jpeg,image/png" multiple onChange={handlePhotoChange} className="text-sm" />
              )}
            </div>
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-red py-3 text-sm font-semibold text-white hover:bg-brand-red-dark disabled:opacity-60"
            >
              {submitting ? t.sellPart.submitting : t.sellPart.submitButton}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
