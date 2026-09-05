"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Printer, CheckCircle2, XCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import Pagination from "@/components/Pagination";

interface PrintEvent {
  id: string;
  productId: string | null;
  sku: string | null;
  externalJobId: string;
  status: "PRINTED" | "FAILED";
  message: string | null;
  createdAt: string;
  product: { id: string; title: string; sku: string; slug: string } | null;
}

interface ListResponse {
  items: PrintEvent[];
  total: number;
  page: number;
  totalPages: number;
}

const LIMIT = 25;

export default function PrintEventsPage() {
  const token = useAdminStore((s) => s.token);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<ListResponse>(`/print-events?page=${page}&limit=${LIMIT}`, token)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load print events"));
  }, [token, page]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
          <Printer size={22} /> Printed files
        </h1>
        <p className="text-sm text-ink-soft">
          {data ? `${data.total} print event${data.total === 1 ? "" : "s"} recorded` : "Loading…"} — reported by the
          label-printing service so you can see what's already been printed and avoid sending duplicates.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Job ID</th>
              <th className="px-3 py-2 font-medium">Message</th>
              <th className="px-3 py-2 font-medium">Printed at</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((e) => (
              <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-3 py-2">
                  {e.product ? (
                    <Link href={`/admin/products/${e.product.id}`} className="font-medium text-ink hover:text-brand-red">
                      {e.product.title}
                    </Link>
                  ) : (
                    <span className="text-ink-soft" title="No product matched this event's productId/sku">
                      Unmatched{e.sku ? ` (${e.sku})` : ""}
                    </span>
                  )}
                  <div className="part-code text-xs text-ink-soft">{e.product?.sku ?? e.sku ?? "—"}</div>
                </td>
                <td className="px-3 py-2">
                  {e.status === "PRINTED" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                      <CheckCircle2 size={12} /> Printed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                      <XCircle size={12} /> Failed
                    </span>
                  )}
                </td>
                <td className="part-code px-3 py-2 text-xs text-ink-soft">{e.externalJobId}</td>
                <td className="px-3 py-2 text-ink-soft">{e.message ?? "—"}</td>
                <td className="px-3 py-2 text-ink-soft">{new Date(e.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-soft">
                  No print events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />}
    </div>
  );
}
