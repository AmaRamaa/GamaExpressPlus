import { Briefcase, MapPin, Clock, HeartHandshake, TrendingUp, Users2 } from "lucide-react";

const perks = [
  { icon: HeartHandshake, title: "Health coverage", desc: "Private health insurance from day one." },
  { icon: TrendingUp, title: "Growth", desc: "A growing catalog and team — real room to take on more." },
  { icon: Users2, title: "Team discount", desc: "Staff pricing on every part in our catalog." },
];

const openings = [
  { title: "Warehouse Associate", location: "Prishtinë", type: "Full-time" },
  { title: "Parts Sourcing Specialist", location: "Prishtinë", type: "Full-time" },
  { title: "Customer Support Agent", location: "Prishtinë · Remote-friendly", type: "Full-time" },
];

export default function CareersPage() {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <Briefcase size={28} className="mx-auto mb-3 text-brand-red" />
        <h1 className="font-display text-3xl font-bold text-ink">Careers at Gama Express</h1>
        <p className="mt-2 text-sm text-ink-soft">
          We're a small team building Kosovo's exterior parts catalog. Here's what it's like to work with us.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
        {perks.map((p) => (
          <div key={p.title} className="rounded-xl border border-surface-border bg-surface p-4 text-center shadow-soft">
            <p.icon size={20} className="mx-auto mb-2 text-brand-red" />
            <p className="text-sm font-semibold text-ink">{p.title}</p>
            <p className="mt-1 text-xs text-ink-soft">{p.desc}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-14 max-w-2xl">
        <h2 className="mb-4 font-display text-xl font-bold text-ink">Open positions</h2>
        <div className="space-y-3">
          {openings.map((o) => (
            <div key={o.title} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface p-4 shadow-soft">
              <div>
                <p className="font-semibold text-ink">{o.title}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-ink-soft">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {o.location}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {o.type}</span>
                </div>
              </div>
              <a
                href="mailto:careers@gamaexpress.com?subject=Application%3A%20"
                className="rounded-lg bg-brand-red px-4 py-2 text-xs font-semibold text-white hover:bg-brand-red-dark"
              >
                Apply
              </a>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-ink-soft">
          Don't see a fit? Send your CV to{" "}
          <a href="mailto:careers@gamaexpress.com" className="font-medium text-brand-red hover:underline">careers@gamaexpress.com</a> anyway.
        </p>
      </div>
    </div>
  );
}
