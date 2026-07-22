import { Truck, MapPinned, Store, Clock } from "lucide-react";

const methods = [
  { name: "Standard delivery", time: "1–3 business days", cost: "€3.90, free over €75", zones: "Prishtinë & surrounding municipalities" },
  { name: "Kosovo-wide delivery", time: "2–4 business days", cost: "€5.90, free over €120", zones: "All other Kosovo cities" },
  { name: "Store pickup", time: "Same day, ready in ~2 hours", cost: "Free", zones: "Gama Express – Prishtinë Central" },
];

export default function ShippingPage() {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <Truck size={28} className="mx-auto mb-3 text-brand-red" />
        <h1 className="font-display text-3xl font-bold text-ink">Shipping info</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Same-day dispatch from our Prishtinë warehouse, with delivery across Kosovo.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl overflow-x-auto rounded-xl border border-surface-border bg-surface shadow-soft">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead className="border-b border-surface-border bg-surface-muted text-xs font-semibold uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Delivery time</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Coverage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {methods.map((m) => (
              <tr key={m.name}>
                <td className="px-4 py-3 font-medium text-ink">{m.name}</td>
                <td className="px-4 py-3 text-ink-soft">{m.time}</td>
                <td className="px-4 py-3 text-ink-soft">{m.cost}</td>
                <td className="px-4 py-3 text-ink-soft">{m.zones}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mx-auto mt-6 grid max-w-3xl gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-surface-border bg-surface p-4 shadow-soft">
          <Clock size={18} className="mb-2 text-brand-red" />
          <p className="text-sm font-semibold text-ink">Cut-off time</p>
          <p className="mt-1 text-xs text-ink-soft">Orders placed before 14:00 ship the same business day.</p>
        </div>
        <div className="rounded-xl border border-surface-border bg-surface p-4 shadow-soft">
          <MapPinned size={18} className="mb-2 text-brand-red" />
          <p className="text-sm font-semibold text-ink">Order tracking</p>
          <p className="mt-1 text-xs text-ink-soft">Track any order from My Account → Order history once it ships.</p>
        </div>
        <div className="rounded-xl border border-surface-border bg-surface p-4 shadow-soft">
          <Store size={18} className="mb-2 text-brand-red" />
          <p className="text-sm font-semibold text-ink">Pickup location</p>
          <p className="mt-1 text-xs text-ink-soft">Rr. Bill Clinton, Prishtinë — select "Store pickup" at checkout.</p>
        </div>
      </div>
    </div>
  );
}
