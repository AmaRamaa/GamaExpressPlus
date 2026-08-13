"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, MapPin, Phone, Heart, ShoppingCart } from "lucide-react";
import { api } from "@/lib/api";
import { resolveIcon } from "@/lib/icon-map";
import { useT, LOCALES } from "@/lib/i18n";
import { useStore } from "@/lib/store";

interface CategoryGroup {
  slug: string;
  name: string;
  icon: string;
  children: { slug: string; name: string }[];
}

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const { t, locale, setLocale } = useT();
  const user = useStore((s) => s.user);
  const cartCount = useStore((s) => s.cart.reduce((n, l) => n + l.quantity, 0));
  const wishlistCount = useStore((s) => s.wishlist.length);

  useEffect(() => {
    if (open && categories.length === 0) {
      api.get<CategoryGroup[]>("/catalog/categories").then(setCategories).catch(() => {});
    }
  }, [open, categories.length]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex items-center justify-center rounded-lg p-2 text-ink hover:bg-surface-muted lg:hidden"
      >
        <Menu size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col overflow-y-auto bg-surface shadow-lifted">
            <div className="flex items-center justify-between border-b border-surface-border p-4">
              <span className="font-display text-lg font-bold text-ink">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-muted"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 border-b border-surface-border p-2">
              <Link
                href="/cart"
                onClick={() => setOpen(false)}
                className="relative flex items-center justify-center gap-2 rounded-lg bg-surface-muted px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-border"
              >
                <ShoppingCart size={17} className="text-brand-red" />
                {t.header.cart}
                {cartCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-semibold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                href="/account?tab=wishlist"
                onClick={() => setOpen(false)}
                className="relative flex items-center justify-center gap-2 rounded-lg bg-surface-muted px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-border"
              >
                <Heart size={17} className="text-brand-red" />
                {t.header.favorites}
                {wishlistCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-semibold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </div>

            <nav className="flex-1 p-2">
              {categories.map((c) => {
                const Icon = resolveIcon(c.icon);
                return (
                  <Link
                    key={c.slug}
                    href={`/products?category=${c.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-muted"
                  >
                    <Icon size={18} className="text-brand-red" />
                    {c.name}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-surface-border p-2">
              <Link
                href="/vehicle-finder"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-muted"
              >
                {t.header.vehicleFinder}
              </Link>
              <Link
                href="/business"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-muted"
              >
                {t.header.businessAccounts}
              </Link>
              <Link
                href="/account?tab=orders"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-muted"
              >
                {t.header.trackOrder}
              </Link>
              <Link
                href={user ? "/account" : "/login"}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-muted"
              >
                {user ? user.name : t.header.signIn}
              </Link>
            </div>

            <div className="border-t border-surface-border p-4 text-xs text-ink-soft">
              <p className="mb-2 flex items-center gap-1.5">
                <MapPin size={12} /> {t.header.location}
              </p>
              <p className="mb-3 flex items-center gap-1.5">
                <Phone size={12} /> +383 44 000 000
              </p>
              <div className="flex gap-1.5">
                {LOCALES.map(({ code, label }) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLocale(code)}
                    className={`rounded px-2 py-1 text-xs font-semibold ${
                      locale === code ? "bg-brand-red text-white" : "bg-surface-muted text-ink-soft"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
