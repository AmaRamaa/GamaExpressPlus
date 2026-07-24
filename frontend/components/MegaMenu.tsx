"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { resolveIcon } from "@/lib/icon-map";
import { useT } from "@/lib/i18n";

interface CategoryGroup {
  slug: string;
  name: string;
  icon: string;
  children: { slug: string; name: string }[];
}

export default function MegaMenu() {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [megaMenu, setMegaMenu] = useState<CategoryGroup[]>([]);
  const { t } = useT();

  useEffect(() => {
    api.get<CategoryGroup[]>("/catalog/categories").then(setMegaMenu).catch(() => {});
  }, []);

  return (
    <nav className="hidden border-t border-surface-border bg-surface lg:block">
      <div className="container-page relative flex items-center gap-1">
        {megaMenu.map((group) => {
          const Icon = resolveIcon(group.icon);
          const isOpen = openSlug === group.slug;
          return (
            <div
              key={group.slug}
              className="relative"
              onMouseEnter={() => setOpenSlug(group.slug)}
              onMouseLeave={() => setOpenSlug(null)}
            >
              <Link
                href={`/products?category=${group.slug}`}
                className={`flex items-center gap-2 px-3.5 py-3 text-sm font-medium transition-colors ${
                  isOpen ? "text-brand-red" : "text-ink-soft hover:text-brand-red"
                }`}
              >
                <Icon size={16} />
                {group.name}
                <ChevronDown size={12} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </Link>

              {isOpen && group.children.length > 0 && (
                <div className="absolute left-0 top-full z-30 w-64 rounded-b-xl border border-t-0 border-surface-border bg-surface p-4 shadow-lifted">
                  <ul className="space-y-1">
                    {group.children.map((sub) => (
                      <li key={sub.slug}>
                        <Link
                          href={`/products?category=${group.slug}&sub=${sub.slug}`}
                          className="block rounded-lg px-2.5 py-1.5 text-sm text-ink-soft hover:bg-surface-muted hover:text-brand-red"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/products?category=${group.slug}`}
                    className="mt-2 block rounded-lg bg-brand-red-light px-2.5 py-2 text-center text-xs font-semibold text-brand-red hover:bg-brand-red hover:text-white"
                  >
                    View all {group.name}
                  </Link>
                </div>
              )}
            </div>
          );
        })}

        <Link href="/products?sort=newest" className="ml-auto px-3.5 py-3 text-sm font-medium text-ink-soft hover:text-brand-red">
          {t.header.newArrivals}
        </Link>
        <Link href="/products?sale=1" className="rounded-md bg-brand-red px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-brand-red-dark">
          {t.header.sale}
        </Link>
      </div>
    </nav>
  );
}
