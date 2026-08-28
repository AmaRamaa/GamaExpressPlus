"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { PackagePlus, X, Plus, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { api, ApiError } from "@/lib/api";

interface SubmissionResponse {
  status: "PENDING" | "REJECTED" | "APPROVED" | "PROMOTED";
}

interface Part {
  id: string;
  title: string;
  description: string;
  photos: File[];
}

interface PartResult {
  id: string;
  title: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "PROMOTED" | "ERROR";
  message?: string;
}

const MAX_PHOTOS = 4;

function emptyPart(): Part {
  return { id: Math.random().toString(36).slice(2), title: "", description: "", photos: [] };
}

export default function SellPartPage() {
  const { t } = useT();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [parts, setParts] = useState<Part[]>([emptyPart()]);
  const [partErrors, setPartErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [results, setResults] = useState<PartResult[] | null>(null);

  function updatePart(id: string, patch: Partial<Part>) {
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function addPart() {
    setParts((prev) => [...prev, emptyPart()]);
  }

  function removePart(id: string) {
    setParts((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
  }

  function handlePhotoChange(id: string, e: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files || []);
    setParts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, photos: [...p.photos, ...chosen].slice(0, MAX_PHOTOS) } : p))
    );
    e.target.value = "";
  }

  function removePhoto(id: string, index: number) {
    setParts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, photos: p.photos.filter((_, i) => i !== index) } : p))
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const nextErrors: Record<string, string> = {};
    for (const part of parts) {
      if (!part.title.trim()) nextErrors[part.id] = t.sellPart.errorPartTitleRequired;
      else if (part.photos.length === 0) nextErrors[part.id] = t.sellPart.errorPartNoPhoto;
    }
    setPartErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setResults(null);
    setProgress({ done: 0, total: parts.length });

    const collected: PartResult[] = [];
    for (const part of parts) {
      const fd = new FormData();
      fd.append("submitterName", fullName);
      fd.append("submitterEmail", email);
      fd.append("submitterPhone", phone);
      fd.append("title", part.title);
      fd.append("description", part.description);
      fd.append("locationCompany", company);
      part.photos.forEach((file) => fd.append("images", file));

      try {
        const res = await api.upload<SubmissionResponse>("/submissions", fd);
        collected.push({ id: part.id, title: part.title, status: res.status });
      } catch (err) {
        collected.push({
          id: part.id,
          title: part.title,
          status: "ERROR",
          message: err instanceof ApiError ? err.message : t.sellPart.errorGeneric,
        });
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }

    setResults(collected);
    setSubmitting(false);
    setProgress(null);
  }

  const resultLabel: Record<PartResult["status"], string> = {
    APPROVED: t.sellPart.resultApproved,
    PROMOTED: t.sellPart.resultApproved,
    PENDING: t.sellPart.resultPending,
    REJECTED: t.sellPart.resultRejected,
    ERROR: t.sellPart.resultError,
  };
  const resultStyle: Record<PartResult["status"], string> = {
    APPROVED: "bg-success-light text-success",
    PROMOTED: "bg-success-light text-success",
    PENDING: "bg-slate-100 text-slate-600",
    REJECTED: "bg-amber-50 text-amber-700",
    ERROR: "bg-red-50 text-red-600",
  };

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <PackagePlus size={28} className="mx-auto mb-3 text-brand-red" />
          <h1 className="font-display text-2xl font-bold text-ink">{t.sellPart.pageTitle}</h1>
          <p className="mt-2 text-sm text-ink-soft">{t.sellPart.pageDesc}</p>
        </div>

        {results ? (
          <div className="space-y-2 rounded-xl border border-surface-border bg-surface p-6 shadow-soft">
            <p className="mb-3 font-display text-base font-bold text-ink">{t.sellPart.resultsTitle}</p>
            {results.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted px-3 py-2">
                <span className="min-w-0 truncate text-sm text-ink">{r.title}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${resultStyle[r.status]}`}>
                  {resultLabel[r.status]}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl border border-surface-border bg-surface p-6 shadow-soft">
              <p className="mb-3 font-display text-sm font-semibold text-ink">{t.sellPart.contactSectionTitle}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">{t.sellPart.fullNameLabel}</label>
                  <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">{t.sellPart.emailLabel}</label>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">{t.sellPart.phoneLabel}</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">{t.sellPart.companyLabel}</label>
                  <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t.sellPart.companyPlaceholder} className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm" />
                </div>
              </div>
            </div>

            <div>
              <p className="mb-1 font-display text-sm font-semibold text-ink">{t.sellPart.partsSectionTitle}</p>
              <p className="mb-3 text-xs text-ink-soft">{t.sellPart.partsSectionDesc}</p>

              <div className="space-y-4">
                {parts.map((part, i) => (
                  <div key={part.id} className="rounded-xl border border-surface-border bg-surface p-5 shadow-soft">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        {t.sellPart.partLabel} {i + 1}
                      </span>
                      {parts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePart(part.id)}
                          className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                        >
                          <Trash2 size={13} /> {t.sellPart.removePart}
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-ink-soft">{t.sellPart.titleLabel}</label>
                        <input
                          value={part.title}
                          onChange={(e) => updatePart(part.id, { title: e.target.value })}
                          placeholder={t.sellPart.titlePlaceholder}
                          className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-ink-soft">{t.sellPart.descriptionLabel}</label>
                        <textarea
                          value={part.description}
                          onChange={(e) => updatePart(part.id, { description: e.target.value })}
                          rows={3}
                          className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-ink-soft">{t.sellPart.photosLabel}</label>
                        <p className="mb-2 text-xs text-ink-soft">{t.sellPart.photosHint}</p>
                        {part.photos.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-2">
                            {part.photos.map((file, pi) => (
                              <div key={pi} className="relative h-16 w-16 overflow-hidden rounded-lg border border-surface-border">
                                <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removePhoto(part.id, pi)}
                                  aria-label="Remove photo"
                                  className="absolute right-0.5 top-0.5 rounded-full bg-ink/70 p-0.5 text-white hover:bg-ink"
                                >
                                  <X size={11} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {part.photos.length < MAX_PHOTOS && (
                          <input type="file" accept="image/jpeg,image/png" multiple onChange={(e) => handlePhotoChange(part.id, e)} className="text-sm" />
                        )}
                      </div>
                      {partErrors[part.id] && <p className="text-xs text-red-600">{partErrors[part.id]}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addPart}
                className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-surface-border px-3 py-2 text-sm font-medium text-brand-red hover:border-brand-red"
              >
                <Plus size={15} /> {t.sellPart.addAnotherPart}
              </button>
            </div>

            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-red py-3 text-sm font-semibold text-white hover:bg-brand-red-dark disabled:opacity-60"
            >
              {progress
                ? `${t.sellPart.submittingProgress}… (${progress.done}/${progress.total})`
                : `${t.sellPart.submitAllButton} (${parts.length})`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
