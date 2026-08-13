"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  Tags,
  FolderTree,
  Upload,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";

interface Summary {
  totalOrders: number;
  totalRevenueEur: number;
  totalUsers: number;
  totalProducts: number;
  lowStockCount: number;
  pendingReviews: number;
  openQuotes: number;
}

interface LowStockProduct {
  id: string;
  title: string;
  sku: string;
  stockQuantity: number;
  stockStatus: string;
}

const QUICK_LINKS = [
  { href: "/admin/products/new", label: "Add Product", code: "AP", color: "bg-blue-600", roles: ["ADMIN", "SUPER_ADMIN", "WAREHOUSE_STAFF"] },
  { href: "/admin/products", label: "Products", code: "PR", color: "bg-emerald-600", icon: Package, roles: ["ADMIN", "SUPER_ADMIN", "WAREHOUSE_STAFF"] },
  { href: "/admin/brands", label: "Brands", code: "BR", color: "bg-amber-600", icon: Tags, roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/categories", label: "Categories", code: "CA", color: "bg-violet-600", icon: FolderTree, roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/import", label: "Import", code: "IM", color: "bg-rose-600", icon: Upload, roles: ["ADMIN", "SUPER_ADMIN", "WAREHOUSE_STAFF"] },
  { href: "/admin/orders", label: "Orders", code: "OR", color: "bg-cyan-600", icon: ShoppingBag, roles: ["ADMIN", "SUPER_ADMIN", "SUPPORT"] },
];

const ANALYTICS_ROLES = ["ADMIN", "SUPER_ADMIN"];

export default function AdminDashboardPage() {
  const token = useAdminStore((s) => s.token);
  const user = useAdminStore((s) => s.user);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [error, setError] = useState("");
  const canSeeAnalytics = !!user && ANALYTICS_ROLES.includes(user.role);
  const visibleQuickLinks = QUICK_LINKS.filter((q) => !user || q.roles.includes(user.role));

  useEffect(() => {
    if (!token || !canSeeAnalytics) return;
    api
      .get<Summary>("/admin/analytics/summary", token)
      .then(setSummary)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load"));
    api
      .get<LowStockProduct[]>("/admin/inventory/low-stock", token)
      .then((items) => setLowStock(items.slice(0, 8)))
      .catch(() => {});
  }, [token, canSeeAnalytics]);

  const stats = summary
    ? [
        { label: "Revenue (paid)", value: `€${summary.totalRevenueEur.toFixed(2)}`, icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
        { label: "Orders", value: summary.totalOrders, icon: ShoppingBag, color: "text-blue-600 bg-blue-50" },
        { label: "Active products", value: summary.totalProducts, icon: Package, color: "text-violet-600 bg-violet-50" },
        { label: "Registered users", value: summary.totalUsers, icon: Users, color: "text-amber-600 bg-amber-50" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-soft">Overview of store performance and operations</p>
      </div>

      {error && canSeeAnalytics && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {/* Quick launcher grid — Pro-Data style */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Quick actions</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {visibleQuickLinks.map((q) => (
            <Link key={q.href} href={q.href} className="flex flex-col items-center gap-1.5 rounded-lg p-2 text-center hover:bg-slate-50">
              <div className={`flex size-11 items-center justify-center rounded-lg ${q.color} text-sm font-bold text-white`}>
                {q.code}
              </div>
              <span className="text-xs font-medium text-ink-soft">{q.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {canSeeAnalytics && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
                <div className={`mb-3 flex size-9 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon size={18} />
                </div>
                <p className="text-2xl font-bold text-ink">{s.value}</p>
                <p className="text-xs text-ink-soft">{s.label}</p>
              </div>
            ))}
            {!summary && !error && (
              <p className="col-span-full text-sm text-ink-soft">Loading stats…</p>
            )}
          </div>

          {/* Low stock table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
            <div className="flex items-center gap-2 border-b border-slate-200 p-4">
              <AlertTriangle size={16} className="text-amber-500" />
              <h2 className="font-display text-sm font-semibold text-ink">Inventory alerts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2 font-medium">Product</th>
                    <th className="px-4 py-2 font-medium">SKU</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium text-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-ink-soft">
                        Nothing low on stock.
                      </td>
                    </tr>
                  )}
                  {lowStock.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/products/${p.id}`} className="font-medium text-ink hover:text-brand-red">
                          {p.title}
                        </Link>
                      </td>
                      <td className="part-code px-4 py-2.5 text-ink-soft">{p.sku}</td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.stockStatus === "OUT_OF_STOCK" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-600"}`}>
                          {p.stockStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-ink">{p.stockQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
