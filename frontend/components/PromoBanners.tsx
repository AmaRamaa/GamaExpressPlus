import Link from "next/link";
import { ArrowRight, ShieldCheck, Building2 } from "lucide-react";

const banners = [
  {
    title: "OE-quality body parts",
    desc: "Genuine and OE-matched exterior parts, verified against your vehicle's fitment before checkout.",
    href: "/products",
    icon: ShieldCheck,
    from: "#1F2937", to: "#0B1220",
  },
  {
    title: "Wholesale pricing for garages",
    desc: "Open a business account for tiered discounts, invoicing, and bulk quotes.",
    href: "/business",
    icon: Building2,
    from: "#B30000", to: "#5C0000",
  },
];

export default function PromoBanners() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {banners.map((b) => (
        <Link
          key={b.title}
          href={b.href}
          className="group relative flex items-center gap-4 overflow-hidden rounded-xl p-6 shadow-card"
          style={{ background: `linear-gradient(135deg, ${b.from}, ${b.to})` }}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
            <b.icon size={22} />
          </div>
          <div className="flex-1">
            <p className="font-display text-lg font-semibold text-white">{b.title}</p>
            <p className="mt-0.5 text-sm text-white/70">{b.desc}</p>
          </div>
          <ArrowRight size={18} className="shrink-0 text-white/70 transition-transform group-hover:translate-x-1" />
        </Link>
      ))}
    </div>
  );
}
