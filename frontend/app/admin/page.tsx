import { AlertTriangle, DollarSign, Package, ShoppingBag, Star, Users } from "lucide-react";
import { products } from "@/lib/mock-data";

const stats = [
  { label: "Revenue (30d)", value: "€24,318", icon: DollarSign },
  { label: "Orders (30d)", value: "312", icon: ShoppingBag },
  { label: "Active products", value: "8,412", icon: Package },
  { label: "Registered users", value: "2,904", icon: Users },
];

const recentOrders = [
  { id: "GE-2026-000312", customer: "Arben Krasniqi", total: 78.4, status: "Processing" },
  { id: "GE-2026-000311", customer: "Auto Servis Dardania", total: 640.0, status: "Paid" },
  { id: "GE-2026-000310", customer: "Fatmire Gashi", total: 42.5, status: "Shipped" },
];

export default function AdminDashboardPage() {
  const lowStock = products.filter((p) => p.stockStatus === "LOW_STOCK" || p.stockStatus === "OUT_OF_STOCK");

  return (
    <div className="container-page py-8">
      <h1 className="mb-1 font-display text-2xl font-bold text-ink">Admin dashboard</h1>
      <p className="mb-6 text-sm text-ink-soft">Overview of store performance and operations</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-surface-border bg-surface p-5 shadow-soft">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-red-light text-brand-red">
              <s.icon size={18} />
            </div>
            <p className="text-2xl font-bold text-ink">{s.value}</p>
            <p className="text-xs text-ink-soft">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Low stock */}
        <div className="rounded-xl border border-surface-border bg-surface p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="font-display text-lg font-semibold text-ink">Inventory alerts</h2>
          </div>
          <div className="space-y-3">
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-ink">{p.title}</p>
                  <p className="part-code text-xs text-ink-soft">{p.sku}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.stockStatus === "OUT_OF_STOCK" ? "bg-surface-muted text-ink-soft" : "bg-amber-50 text-amber-600"}`}>
                  {p.stockQuantity} left
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="rounded-xl border border-surface-border bg-surface p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingBag size={16} className="text-brand-red" />
            <h2 className="font-display text-lg font-semibold text-ink">Recent orders</h2>
          </div>
          <div className="space-y-3">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="part-code font-medium text-ink">{o.id}</p>
                  <p className="text-xs text-ink-soft">{o.customer}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-success-light px-2.5 py-1 text-xs font-medium text-success">{o.status}</span>
                  <span className="font-semibold text-ink">€{o.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review moderation */}
        <div className="rounded-xl border border-surface-border bg-surface p-5 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Star size={16} className="text-brand-red" />
            <h2 className="font-display text-lg font-semibold text-ink">Pending review moderation</h2>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-surface-muted p-4 text-sm">
            <div>
              <p className="font-medium text-ink">"Great fit, arrived fast" — Brembo Front Brake Pad Set</p>
              <p className="text-xs text-ink-soft">by Genc M. · ★★★★★</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white">Approve</button>
              <button className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-ink-soft">Reject</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
