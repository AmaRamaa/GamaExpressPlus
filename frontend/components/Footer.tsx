import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Mail } from "lucide-react";

const columns = [
  {
    title: "Shop",
    links: [
      { label: "Bumpers & Body Panels", href: "/products?category=bumpers-body-panels" },
      { label: "Lighting", href: "/products?category=lighting" },
      { label: "Mirrors & Glass", href: "/products?category=mirrors-glass" },
      { label: "Exterior Trim & Grilles", href: "/products?category=trim-grilles" },
    ],
  },
  {
    title: "Customer Care",
    links: [
      { label: "Track your order", href: "/account?tab=orders" },
      { label: "Returns & warranty", href: "/returns" },
      { label: "Request a part", href: "/request-part" },
      { label: "Shipping info", href: "/shipping" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Business",
    links: [
      { label: "Wholesale accounts", href: "/business#wholesale" },
      { label: "Bulk quote request", href: "/business#quote" },
      { label: "Invoicing", href: "/business#invoicing" },
      { label: "Branch locations", href: "/business#locations" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Gama Express", href: "/about" },
      { label: "Automotive blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Contact us", href: "/contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-surface-border bg-ink text-white/80">
      <div className="container-page grid grid-cols-2 gap-8 py-12 md:grid-cols-4 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-1">
          <div className="mb-3 inline-block rounded-lg bg-white px-3 py-2">
            <Image
              src="/logo.jpg"
              alt="Gama Express Auto Pjesë"
              width={1707}
              height={740}
              className="h-9 w-auto object-contain"
            />
          </div>
          <p className="text-sm text-white/60">
            Genuine and aftermarket exterior auto parts, delivered across Kosovo — fast, verified fitment, trusted brands.
          </p>
          <div className="mt-4 flex gap-3">
            <a href="#" aria-label="Facebook" className="rounded-full bg-white/10 p-2 hover:bg-white/20"><Facebook size={16} /></a>
            <a href="#" aria-label="Instagram" className="rounded-full bg-white/10 p-2 hover:bg-white/20"><Instagram size={16} /></a>
            <a href="#" aria-label="Email" className="rounded-full bg-white/10 p-2 hover:bg-white/20"><Mail size={16} /></a>
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white">{col.title}</p>
            <ul className="space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.label}><Link href={l.href} className="text-white/60 hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-xs text-white/50 sm:flex-row">
          <span>© {new Date().getFullYear()} Gama Express. All rights reserved.</span>
          <span>Prishtinë, Kosovë · VAT ID 811234567</span>
        </div>
      </div>
    </footer>
  );
}
