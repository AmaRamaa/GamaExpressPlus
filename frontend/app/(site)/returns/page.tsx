import Link from "next/link";
import { RotateCcw, ShieldCheck, XCircle, ListChecks } from "lucide-react";

const sections = [
  {
    icon: RotateCcw,
    title: "30-day return window",
    body: "Unused parts in original packaging can be returned within 30 days of delivery for a full refund, minus original shipping costs. Parts that have been installed, painted, or modified cannot be returned unless defective.",
  },
  {
    icon: ShieldCheck,
    title: "Warranty coverage",
    body: "Every part carries a minimum 24-month manufacturer warranty against defects. Warranty claims are handled directly with our support team — we coordinate replacement or refund once the fault is confirmed, no need to contact the manufacturer yourself.",
  },
  {
    icon: ListChecks,
    title: "How to start a return",
    body: "Go to My Account → Order history, select the order, and choose \"Start a return.\" You'll get a return authorization number and drop-off instructions. Alternatively, contact support with your order number and we'll process it manually.",
  },
  {
    icon: XCircle,
    title: "Non-returnable items",
    body: "Custom-painted or color-matched body panels, electrical parts once wired in, and parts marked \"Final sale\" at checkout cannot be returned unless they arrived defective or don't match the listed fitment.",
  },
];

export default function ReturnsPage() {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-bold text-ink">Returns & Warranty</h1>
        <p className="mt-2 text-sm text-ink-soft">
          We want you to get the right part the first time. Here's how returns and warranty claims work.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <div key={s.title} className="rounded-xl border border-surface-border bg-surface p-5 shadow-soft">
            <s.icon size={20} className="mb-3 text-brand-red" />
            <p className="font-display text-base font-semibold text-ink">{s.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-surface-border bg-surface-muted p-5 text-center text-sm text-ink-soft">
        Need help with a specific order? <Link href="/contact" className="font-medium text-brand-red hover:underline">Contact support</Link> and we'll sort it out.
      </div>
    </div>
  );
}
