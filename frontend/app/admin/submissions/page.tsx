"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X, Trash2, ArrowUpRight } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";

interface Submission {
  id: string;
  createdAt: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string | null;
  title: string;
  description: string | null;
  locationCompany: string | null;
  images: string[];
  status: "PENDING" | "REJECTED" | "APPROVED" | "PROMOTED";
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

export default function AdminSubmissionsPage() {
  const token = useAdminStore((s) => s.token);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>("PENDING");
  const [error, setError] = useState("");
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  function load() {
    const query = tab === "ALL" ? "" : `?status=${tab}`;
    api
      .get<Submission[]>(`/submissions${query}`, token)
      .then(setSubmissions)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load submissions"));
  }

  useEffect(load, [token, tab]);

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
        <p className="text-sm text-ink-soft">Parts visitors offered to sell via the public "Sell your part" page.</p>
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
        {submissions.map((s) => (
          <div key={s.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-soft sm:flex-row">
            <div className="flex shrink-0 gap-1.5">
              {s.images.slice(0, 3).map((url, i) => (
                <img key={i} src={url} alt="" className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
              ))}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-ink">{s.title}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[s.status]}`}>{s.status}</span>
              </div>
              <p className="mt-0.5 text-xs text-ink-soft">
                {s.submitterName} · {s.submitterEmail}{s.submitterPhone ? ` · ${s.submitterPhone}` : ""} ·{" "}
                {new Date(s.createdAt).toLocaleDateString()}
              </p>
              {s.description && <p className="mt-1.5 text-sm text-ink-soft">{s.description}</p>}
              {s.locationCompany && <p className="mt-1 text-xs text-ink-soft">Company: {s.locationCompany}</p>}
              {s.aiReasoning && (
                <p className="mt-1.5 text-xs italic text-ink-soft">
                  AI: {s.aiIsCarPart ? "looks like a car part" : "doesn't look like a car part"} — {s.aiReasoning}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-start gap-1.5">
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
        ))}
        {submissions.length === 0 && !error && (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center text-sm text-ink-soft">
            No submissions in this view.
          </p>
        )}
      </div>
    </div>
  );
}
