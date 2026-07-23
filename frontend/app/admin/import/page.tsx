"use client";

import { useState, type ChangeEvent } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Download } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";

const REQUIRED_COLUMNS = ["sku", "title", "partNumber", "brand", "category", "priceEur"];
const TEMPLATE_COLUMNS = [
  "sku",
  "title",
  "partNumber",
  "brand",
  "category",
  "priceEur",
  "stockQuantity",
  "shortDescription",
  "oemNumbers",
];

interface RawRow {
  [key: string]: string;
}

interface PreviewRow {
  data: RawRow;
  errors: string[];
}

interface ImportResult {
  created: number;
  failed: number;
  results: { row: number; sku?: string; status: "created" | "error"; error?: string }[];
}

function validateRow(row: RawRow): string[] {
  const errors: string[] = [];
  for (const col of REQUIRED_COLUMNS) {
    if (!String(row[col] ?? "").trim()) errors.push(`missing ${col}`);
  }
  const price = Number(row.priceEur);
  if (row.priceEur && (!Number.isFinite(price) || price < 0)) errors.push("priceEur must be a non-negative number");
  if (row.stockQuantity) {
    const stock = Number(row.stockQuantity);
    if (!Number.isFinite(stock) || stock < 0) errors.push("stockQuantity must be a non-negative number");
  }
  return errors;
}

export default function AdminImportPage() {
  const token = useAdminStore((s) => s.token);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleRows(raw: RawRow[]) {
    setRows(raw.map((data) => ({ data, errors: validateRow(data) })));
    setResult(null);
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError("");
    setResult(null);

    if (file.name.endsWith(".csv")) {
      Papa.parse<RawRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          if (res.errors.length > 0) setParseError(res.errors[0].message);
          handleRows(res.data);
        },
        error: (err) => setParseError(err.message),
      });
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const wb = XLSX.read(evt.target?.result, { type: "binary" });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "" });
          handleRows(json);
        } catch (err) {
          setParseError(err instanceof Error ? err.message : "Failed to parse spreadsheet");
        }
      };
      reader.readAsBinaryString(file);
    }
  }

  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);

  async function handleImport() {
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      const payload = validRows.map((r) => ({
        sku: r.data.sku,
        title: r.data.title,
        partNumber: r.data.partNumber,
        brand: r.data.brand,
        category: r.data.category,
        priceEur: r.data.priceEur,
        stockQuantity: r.data.stockQuantity || "0",
        shortDescription: r.data.shortDescription,
        oemNumbers: r.data.oemNumbers,
      }));
      const res = await api.post<ImportResult>("/admin/products/import", { rows: payload }, token);
      setResult(res);
    } catch (err) {
      setParseError(err instanceof ApiError ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function downloadTemplate() {
    const csv = Papa.unparse([TEMPLATE_COLUMNS.reduce((acc, c) => ({ ...acc, [c]: "" }), {})]);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Import products</h1>
        <p className="text-sm text-ink-soft">Upload a CSV or Excel file. Every row is validated before anything is written.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-ink">Required columns: {REQUIRED_COLUMNS.join(", ")}</p>
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs font-medium text-brand-red hover:underline">
            <Download size={14} /> Download template
          </button>
        </div>
        <p className="mb-4 text-xs text-ink-soft">
          Optional columns: stockQuantity, shortDescription, oemNumbers (comma-separated). Brands and categories that
          don&apos;t exist yet are created automatically.
        </p>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 py-8 text-center hover:border-brand-red">
          <Upload size={22} className="text-slate-400" />
          <span className="text-sm font-medium text-ink">{fileName || "Click to choose a .csv or .xlsx file"}</span>
          <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" />
        </label>
        {parseError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{parseError}</p>}
      </div>

      {rows.length > 0 && !result && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 size={16} /> {validRows.length} ready to import</span>
            <span className="flex items-center gap-1.5 text-red-600"><XCircle size={16} /> {invalidRows.length} with errors</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-soft">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Brand</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={`border-b border-slate-50 ${r.errors.length > 0 ? "bg-red-50/50" : ""}`}>
                    <td className="px-3 py-2 text-ink-soft">{i + 1}</td>
                    <td className="part-code px-3 py-2">{r.data.sku}</td>
                    <td className="px-3 py-2">{r.data.title}</td>
                    <td className="px-3 py-2 text-ink-soft">{r.data.brand}</td>
                    <td className="px-3 py-2 text-ink-soft">{r.data.category}</td>
                    <td className="px-3 py-2 text-ink-soft">{r.data.priceEur}</td>
                    <td className="px-3 py-2">
                      {r.errors.length === 0 ? (
                        <span className="text-xs font-medium text-emerald-600">OK</span>
                      ) : (
                        <span className="text-xs font-medium text-red-600" title={r.errors.join("; ")}>
                          {r.errors[0]}{r.errors.length > 1 ? ` +${r.errors.length - 1}` : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            disabled={importing || validRows.length === 0}
            className="flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-red-dark disabled:opacity-60"
          >
            <FileSpreadsheet size={16} />
            {importing ? "Importing…" : `Import ${validRows.length} products`}
          </button>
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink">Import complete</h2>
          <div className="mb-4 flex gap-4 text-sm">
            <span className="text-emerald-600">{result.created} created</span>
            <span className="text-red-600">{result.failed} failed</span>
          </div>
          {result.failed > 0 && (
            <ul className="space-y-1 text-xs text-ink-soft">
              {result.results.filter((r) => r.status === "error").map((r) => (
                <li key={r.row}>Row {r.row} ({r.sku || "no sku"}): {r.error}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
