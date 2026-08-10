"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalEur: number;
  createdAt: string;
  user: { email: string; companyName: string | null } | null;
  items: { id: string }[];
}

export default function AdminOrdersPage() {
  const token = useAdminStore((s) => s.token);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Order[]>("/admin/orders", token)
      .then(setOrders)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load orders"));
  }, [token]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Orders</h1>
        <p className="text-sm text-ink-soft">{orders.length} orders</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-soft">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-2.5 font-medium">Order #</th>
              <th className="px-4 py-2.5 font-medium">Customer</th>
              <th className="px-4 py-2.5 font-medium">Items</th>
              <th className="px-4 py-2.5 font-medium">Payment</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="part-code px-4 py-2.5 font-medium text-ink">{o.orderNumber}</td>
                <td className="px-4 py-2.5 text-ink-soft">{o.user?.companyName || o.user?.email || "Guest"}</td>
                <td className="px-4 py-2.5 text-ink-soft">{o.items.length}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${o.paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                    {o.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-ink-soft">{o.status}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-ink">€{o.totalEur.toFixed(2)}</td>
              </tr>
            ))}
            {orders.length === 0 && !error && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-soft">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
