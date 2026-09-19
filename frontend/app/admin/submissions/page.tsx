"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, X, Trash2, ArrowUpRight, Eye, Mail, Phone as PhoneIcon } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";

interface Submission {
  id: string;
  createdAt: string;
  submitterName: string;
  submitterEmail: string | null;
  submitterPhone: string | null;
  title: string;
  description: string | null;
  oemNumbers: string[];
  askingPriceEur: number | null;
  category: { name: string } | null;
  brand: { name: string } | null;
  locationCompany: string | null;
  images: string[];
  status: "PENDING" | "REJECTED" | "APPROVED" | "PROMOTED";
  isRead: boolean;
  aiIsCarPart: boolean | null;
  aiReasoning: string | null;
}

const STATUS_TABS = ["PENDING", "APPROVED", "REJECTED", "PROMOTED", "ALL"] as const;

const STATUS_STYLE: Record<Submission["status"], string> = {
  PENDING: "bg-slate-100 text-slate-600",
  APPROVED: "bg-emerald-50 text-emerald-600",
  REJECTED: "bg-red-50 text-red-600",
  PROMOTED: "bg-brand-red-light text-brand-red",
};

// Groups submissions by seller (email when given, else name -- sellers often
// skip email but always give a name) so the review queue can show "3 unread
// from this seller" instead of an admin having to notice a pattern by eye.
function sellerKey(s: Submission) {
  return (s.submitterEmail || s.submitterName).trim().toLowerCase();
}

function SubmissionDetailModal({ submission, onClose }: { submission: Submission; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-lifted"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">{submission.title}</h2>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[submission.status]}`}>
              {submission.status}
            </span>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-ink-soft hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {submission.images.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {submission.images.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt="" className="aspect-square w-full rounded-lg border border-slate-200 object-cover" />
              </a>
            ))}
          </div>
        )}

        <div className="space-y-3 text-sm">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Seller</p>
            <p className="font-medium text-ink">{submission.submitterName}</p>
            <div className="mt-1 flex flex-col gap-1 text-ink-soft">
              {submission.submitterEmail && (
                <span className="flex items-center gap-1.5"><Mail size={13} /> {submission.submitterEmail}</span>
              )}
              {submission.submitterPhone && (
                <span className="flex items-center gap-1.5"><PhoneIcon size={13} /> {submission.submitterPhone}</span>
              )}
              {submission.locationCompany && <span>Company / location: {submission.locationCompany}</span>}
            </div>
            <p className="mt-1 text-xs text-ink-soft">Submitted {new Date(submission.createdAt).toLocaleString()}</p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Part</p>
            {submission.description && <p className="mb-2 whitespace-pre-wrap text-ink">{submission.description}</p>}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-ink-soft">
              <dt>Category</dt>
              <dd className="text-ink">{submission.category?.name || "—"}</dd>
              <dt>Brand</dt>
              <dd className="text-ink">{submission.brand?.name || "—"}</dd>
              <dt>OEM numbers</dt>
              <dd className="text-ink">{submission.oemNumbers.length > 0 ? submission.oemNumbers.join(", ") : "—"}</dd>
              <dt>Asking price</dt>
              <dd className="text-ink">{submission.askingPriceEur != null ? `€${submission.askingPriceEur.toFixed(2)}` : "—"}</dd>
            </dl>
          </div>

          {submission.aiReasoning && (
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">AI screen</p>
              <p className="text-ink-soft">
                {submission.aiIsCarPart ? "Looks like a car part" : "Doesn't look like a car part"} — {submission.aiReasoning}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          {submission.status !== "PROMOTED" && (
            <Link
              href={`/admin/products/new?fromSubmission=${submission.id}`}
              className="flex items-center gap-1 rounded-lg bg-brand-red px-3 py-2 text-xs font-semibold text-white hover:bg-brand-red-dark"
            >
              <ArrowUpRight size={14} /> Promote to product
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminSubmissionsPage() {
  const token = useAdminStore((s) => s.token);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>("PENDING");
  const [error, setError] = useState("");
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Submission | null>(null);

  function load() {
    const query = tab === "ALL" ? "" : `?status=${tab}`;
    api
      .get<Submission[]>(`/submissions${query}`, token)
      .then(setSubmissions)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load submissions"));
  }

  useEffect(load, [token, tab]);

  const unreadCountBySeller = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of submissions) {
      if (!s.isRead) counts[sellerKey(s)] = (counts[sellerKey(s)] || 0) + 1;
    }
    return counts;
  }, [submissions]);

  const totalUnread = submissions.filter((s) => !s.isRead).length;

  async function markRead(submission: Submission) {
    setViewing(submission);
    if (submission.isRead) return;
    try {
      await api.patch(`/submissions/${submission.id}`, { isRead: true }, token);
      setSubmissions((prev) => prev.map((s) => (s.id === submission.id ? { ...s, isRead: true } : s)));
    } catch {
      // Non-critical -- the detail view still opened, it'll just re-count as
      // unread until the next successful update.
    }
  }

  async function handleOverride(id: string, status: "APPROVED" | "REJECTED") {
    setRowBusy(id);
    setError("");
    try {
      await api.patch(`/submissions/${id}`, { status }, token);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update submission");
    } finally {
      setRowBusy(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this submission? This can't be undone.")) return;
    setRowBusy(id);
    setError("");
    try {
      await api.delete(`/submissions/${id}`, token);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete submission");
    } finally {
      setRowBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Customer submissions</h1>
        <p className="text-sm text-ink-soft">
          Parts visitors offered to sell via the public "Sell your part" page.
          {totalUnread > 0 && <span className="ml-2 font-medium text-brand-red">{totalUnread} unread</span>}
        </p>
      </div>

      <div className="flex gap-1.5">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === s ? "bg-brand-red text-white" : "bg-white text-ink-soft hover:bg-slate-100"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="space-y-3">
        {submissions.map((s) => {
          const sellerUnread = unreadCountBySeller[sellerKey(s)] || 0;
          return (
            <div
              key={s.id}
              className={`flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-soft sm:flex-row ${
                s.isRead ? "border-slate-200" : "border-brand-red/40"
              }`}
            >
              <div className="flex shrink-0 gap-1.5">
                {s.images.slice(0, 3).map((url, i) => (
                  <img key={i} src={url} alt="" className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
                ))}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {!s.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-red" aria-label="Unread" />}
                  <p className="font-medium text-ink">{s.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {s.submitterName}{s.submitterEmail ? ` · ${s.submitterEmail}` : ""}{s.submitterPhone ? ` · ${s.submitterPhone}` : ""} ·{" "}
                  {new Date(s.createdAt).toLocaleDateString()}
                  {sellerUnread > 1 && (
                    <span className="ml-1.5 font-medium text-brand-red">· {sellerUnread} unread from this seller</span>
                  )}
                </p>
                {s.description && <p className="mt-1.5 text-sm text-ink-soft">{s.description}</p>}
                {(s.category || s.brand || s.oemNumbers.length > 0 || s.askingPriceEur != null) && (
                  <p className="mt-1 text-xs text-ink-soft">
                    {s.category ? `Category: ${s.category.name}` : "Category: —"}
                    {s.brand ? ` · Brand: ${s.brand.name}` : ""}
                    {s.oemNumbers.length > 0 ? ` · OEM: ${s.oemNumbers.join(", ")}` : ""}
                    {s.askingPriceEur != null ? ` · Asking: €${s.askingPriceEur.toFixed(2)}` : ""}
                  </p>
                )}
                {s.locationCompany && <p className="mt-1 text-xs text-ink-soft">Company: {s.locationCompany}</p>}
                {s.aiReasoning && (
                  <p className="mt-1.5 text-xs italic text-ink-soft">
                    AI: {s.aiIsCarPart ? "looks like a car part" : "doesn't look like a car part"} — {s.aiReasoning}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-start gap-1.5">
                <button
                  onClick={() => markRead(s)}
                  title="View details"
                  className="rounded-lg border border-slate-200 p-2 text-ink-soft hover:bg-slate-100"
                >
                  <Eye size={15} />
                </button>
                {s.status !== "PROMOTED" && (
                  <>
                    {s.status !== "APPROVED" && (
                      <button
                        onClick={() => handleOverride(s.id, "APPROVED")}
                        disabled={rowBusy === s.id}
                        title="Mark as approved"
                        className="rounded-lg border border-slate-200 p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        <Check size={15} />
                      </button>
                    )}
                    {s.status !== "REJECTED" && (
                      <button
                        onClick={() => handleOverride(s.id, "REJECTED")}
                        disabled={rowBusy === s.id}
                        title="Mark as rejected"
                        className="rounded-lg border border-slate-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <X size={15} />
                      </button>
                    )}
                    <Link
                      href={`/admin/products/new?fromSubmission=${s.id}`}
                      title="Promote to product"
                      className="flex items-center gap-1 rounded-lg bg-brand-red px-2.5 py-2 text-xs font-semibold text-white hover:bg-brand-red-dark"
                    >
                      <ArrowUpRight size={14} /> Promote
                    </Link>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={rowBusy === s.id}
                      title="Delete"
                      className="rounded-lg border border-slate-200 p-2 text-ink-soft hover:bg-slate-100 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {submissions.length === 0 && !error && (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center text-sm text-ink-soft">
            No submissions in this view.
          </p>
        )}
      </div>

      {viewing && <SubmissionDetailModal submission={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
