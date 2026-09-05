"use client";

import { useEffect, useState } from "react";
import { Printer, FileText } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import Pagination from "@/components/Pagination";

interface PrintEvent {
  id: string;
  jobKey: string;
  jobId: string | null;
  documentName: string | null;
  userName: string | null;
  clientComputer: string | null;
  printerName: string | null;
  sizeBytes: number | null;
  pages: number | null;
  printedAt: string | null;
  agentHostname: string;
  capturedPdfFile: string | null;
  createdAt: string;
}

interface ListResponse {
  items: PrintEvent[];
  total: number;
  page: number;
  totalPages: number;
}

const LIMIT = 25;

function formatSize(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

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
          print-monitor agent running on each office/warehouse PC.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-3 py-2 font-medium">Document</th>
              <th className="px-3 py-2 font-medium">User</th>
              <th className="px-3 py-2 font-medium">PC</th>
              <th className="px-3 py-2 font-medium">Printer</th>
              <th className="px-3 py-2 font-medium">Pages</th>
              <th className="px-3 py-2 font-medium">Size</th>
              <th className="px-3 py-2 font-medium">File</th>
              <th className="px-3 py-2 font-medium">Printed at</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((e) => (
              <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-ink">{e.documentName ?? "—"}</td>
                <td className="px-3 py-2 text-ink-soft">{e.userName ?? "—"}</td>
                <td className="part-code px-3 py-2 text-xs text-ink-soft">{e.agentHostname}</td>
                <td className="px-3 py-2 text-ink-soft">{e.printerName ?? "—"}</td>
                <td className="px-3 py-2 text-ink-soft">{e.pages ?? "—"}</td>
                <td className="px-3 py-2 text-ink-soft">{formatSize(e.sizeBytes)}</td>
                <td className="px-3 py-2 text-ink-soft">
                  {e.capturedPdfFile ? (
                    <span
                      className="inline-flex items-center gap-1 text-emerald-600"
                      title={`Local file on ${e.agentHostname}: ${e.capturedPdfFile}`}
                    >
                      <FileText size={14} /> Captured
                    </span>
                  ) : (
                    <span className="text-ink-soft">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-ink-soft">
                  {e.printedAt ? new Date(e.printedAt).toLocaleString() : new Date(e.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink-soft">
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
