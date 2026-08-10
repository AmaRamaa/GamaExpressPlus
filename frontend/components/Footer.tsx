"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Mail } from "lucide-react";
import { useT } from "@/lib/i18n";

const HREFS = [
  [
    "/products?category=bumpers-body-panels",
    "/products?category=lighting",
    "/products?category=mirrors-glass",
    "/products?category=trim-grilles",
  ],
  ["/account?tab=orders", "/returns", "/request-part", "/shipping", "/faq"],
  ["/business#wholesale", "/business#quote", "/business#invoicing", "/business#locations"],
  ["/about", "/blog", "/careers", "/contact"],
];

export default function Footer() {
  const { t } = useT();

  const columns = [
    { title: t.footer.shop, links: t.footer.shopLinks, hrefs: HREFS[0] },
    { title: t.footer.customerCare, links: t.footer.careLinks, hrefs: HREFS[1] },
    { title: t.footer.business, links: t.footer.businessLinks, hrefs: HREFS[2] },
    { title: t.footer.company, links: t.footer.companyLinks, hrefs: HREFS[3] },
  ];

  return (
    <footer className="border-t border-surface-border bg-ink text-white/80">
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
          <p className="text-sm text-white/60">{t.footer.tagline}</p>
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
              {col.links.map((label, i) => (
                <li key={label}><Link href={col.hrefs[i]} className="text-white/60 hover:text-white">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-xs text-white/50 sm:flex-row">
          <span>© {new Date().getFullYear()} Gama Express Sh.p.k. {t.footer.rights}</span>
          <span>Kosovë · Nr. Biznesit 810100587</span>
        </div>
      </div>
    </footer>
  );
}
