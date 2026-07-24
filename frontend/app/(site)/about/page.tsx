import { ShieldCheck, Truck, Users, Package } from "lucide-react";
import { api } from "@/lib/api";

const stats = [
  { icon: Package, value: "1,000+", label: "Exterior parts catalogued" },
  { icon: Users, value: "12+", label: "Vehicle makes supported" },
  { icon: ShieldCheck, value: "24 mo.", label: "Minimum warranty on every part" },
  { icon: Truck, value: "Same-day", label: "Dispatch from Prishtinë" },
];

export default async function AboutPage() {
  const [brands, makes] = await Promise.all([
    api.get<{ name: string }[]>("/catalog/brands"),
    api.get<{ name: string }[]>("/vehicles/makes"),
  ]);
  const supportedMakes = makes.map((m) => m.name);

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-wide text-brand-red">About Gama Express</span>
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          Kosovo's catalog for genuine and aftermarket exterior parts
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          Gama Express started with a simple frustration: ordering a bumper or headlight online too often means
          guessing whether it actually fits. We built our catalog around fitment first — every listing is matched
          to an exact manufacturer, model, generation, and body style before it ever reaches your cart.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-surface-border bg-surface p-4 text-center shadow-soft">
            <s.icon size={20} className="mx-auto mb-2 text-brand-red" />
            <p className="font-display text-xl font-bold text-ink">{s.value}</p>
            <p className="mt-0.5 text-xs text-ink-soft">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-14 max-w-3xl">
        <h2 className="mb-4 font-display text-xl font-bold text-ink">What we stock</h2>
        <p className="text-sm leading-relaxed text-ink-soft">
          Bumpers and body panels, headlights and taillights, mirrors and glass, and exterior trim and grilles —
          from genuine OEM parts to trusted aftermarket brands like {brands.map((b) => b.name).join(", ")}.
          We work with individual customers and body shops alike, offering wholesale pricing for businesses that
          need parts at scale.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        <h2 className="mb-4 font-display text-xl font-bold text-ink">Vehicles we cover</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {supportedMakes.map((make) => (
            <div
              key={make}
              className="flex items-center justify-center rounded-lg border border-surface-border bg-surface-muted px-3 py-5 text-center text-sm font-semibold text-ink-soft"
            >
              {make}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
