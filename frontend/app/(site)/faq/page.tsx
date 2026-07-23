import { ChevronDown } from "lucide-react";

const faqGroups = [
  {
    title: "Ordering & fitment",
    items: [
      {
        q: "How do I know a part will fit my car?",
        a: "Use the Vehicle Finder to select your manufacturer, model, and car year. We'll only show parts verified for that exact generation and variant, so there's no guesswork.",
      },
      {
        q: "What if my model isn't listed?",
        a: "Use the \"Request a part\" form with your vehicle details and a description of what you need — our sourcing team will follow up with options within 1–2 business days.",
      },
      {
        q: "Can I order by OEM or part number?",
        a: "Yes — search by OEM number in the search bar at the top of any page, and matching parts will appear directly.",
      },
    ],
  },
  {
    title: "Shipping & delivery",
    items: [
      {
        q: "How fast will my order arrive?",
        a: "Orders placed before 14:00 dispatch the same business day from our Prishtinë warehouse. Delivery is 1–3 days within Prishtinë and 2–4 days elsewhere in Kosovo. See our Shipping info page for full details.",
      },
      {
        q: "Can I pick up my order in person?",
        a: "Yes — select \"Store pickup\" at checkout and your order will be ready at our Prishtinë Central location, usually within 2 hours.",
      },
    ],
  },
  {
    title: "Returns & warranty",
    items: [
      {
        q: "What's your return policy?",
        a: "Unused parts in original packaging can be returned within 30 days for a full refund. See our Returns & Warranty page for exceptions like painted panels and installed electrical parts.",
      },
      {
        q: "Are parts covered by warranty?",
        a: "Every part carries a minimum 24-month manufacturer warranty against defects, handled directly through our support team.",
      },
    ],
  },
  {
    title: "Business accounts",
    items: [
      {
        q: "Do you offer wholesale pricing?",
        a: "Yes — garages and businesses can open a wholesale account for tiered pricing, invoicing, and bulk quotes. See our Business accounts page to get started.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-bold text-ink">Frequently asked questions</h1>
        <p className="mt-2 text-sm text-ink-soft">Can't find your answer here? Reach out on the Contact page.</p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl space-y-8">
        {faqGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-brand-red">{group.title}</p>
            <div className="divide-y divide-surface-border rounded-xl border border-surface-border bg-surface shadow-soft">
              {group.items.map((item) => (
                <details key={item.q} className="group px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-ink marker:content-none">
                    {item.q}
                    <ChevronDown size={16} className="shrink-0 text-ink-soft transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
