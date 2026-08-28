"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useT } from "@/lib/i18n";

// The root-level not-found boundary: Next.js falls back to this for any URL
// that doesn't match a route at all (a typo'd link, an old bookmark). It
// sits outside the (site) route group's own layout, so Header/Footer are
// included directly here rather than inherited.
export default function NotFound() {
  const { t } = useT();

  return (
    <div>
      <Header />
      <main className="container-page flex flex-col items-center justify-center py-24 text-center">
        <SearchX size={40} className="mb-4 text-brand-red" />
        <p className="font-display text-6xl font-bold text-ink">{t.notFoundPage.code}</p>
        <h1 className="mt-3 font-display text-xl font-bold text-ink">{t.notFoundPage.heading}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">{t.notFoundPage.desc}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/products" className="rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-red-dark">
            {t.notFoundPage.browseButton}
          </Link>
          <Link href="/" className="rounded-lg border border-surface-border px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-muted">
            {t.notFoundPage.homeButton}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
