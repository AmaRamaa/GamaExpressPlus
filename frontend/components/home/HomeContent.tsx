"use client";

import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Truck, Wrench, Headset, ArrowRight, CarFront, Lightbulb, Frame, PanelTop } from "lucide-react";
import VehicleFinder from "@/components/VehicleFinder";
import ProductTabs from "@/components/ProductTabs";
import PromoBanners from "@/components/PromoBanners";
import { useT } from "@/lib/i18n";
import type { Category, Brand, Product } from "@/lib/types";

const categoryIcons: Record<string, typeof Wrench> = {
  "bumpers-body-panels": CarFront,
  "lighting": Lightbulb,
  "mirrors-glass": Frame,
  "trim-grilles": PanelTop,
};

const trustIcons = [ShieldCheck, Truck, Wrench, Headset];

interface Tab {
  label: string;
  products: Product[];
  viewAllHref: string;
}

export default function HomeContent({
  tabs,
  categories,
  brands,
  brandMarquee,
  supportedMakes,
}: {
  tabs: Tab[];
  categories: Category[];
  brands: Brand[];
  brandMarquee: Brand[];
  supportedMakes: string[];
}) {
  const { t } = useT();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-surface-border bg-gradient-to-b from-surface-muted to-surface">
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="#1F2937" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
        <Image
          src="/emblem-red.png"
          alt=""
          width={900}
          height={945}
          aria-hidden
          className="pointer-events-none absolute -right-24 top-1/2 hidden w-[440px] -translate-y-1/2 opacity-[0.06] lg:block"
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-brand-red/10 blur-3xl" />

        <div className="container-page relative grid gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-14">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-brand-red-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-red">
              <Image src="/emblem-red.png" alt="" width={900} height={945} className="h-3.5 w-auto" />
              {t.home.badge}
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
              {t.home.heroTitle1}
              <br />
              {t.home.heroTitle2} <span className="text-brand-red">{t.home.heroTitleHighlight}</span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-ink-soft">{t.home.heroDesc}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/products" className="rounded-lg bg-brand-red px-5 py-3 text-sm font-semibold text-white shadow-lifted hover:bg-brand-red-dark">
                {t.home.browseAll}
              </Link>
              <Link href="/vehicle-finder" className="rounded-lg border border-surface-border bg-surface px-5 py-3 text-sm font-semibold text-ink hover:border-brand-red hover:text-brand-red">
                {t.home.openFinder}
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <VehicleFinder />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-surface-border bg-surface">
        <div className="container-page grid grid-cols-2 gap-6 py-6 sm:grid-cols-4">
          {t.home.trust.map((pt, i) => {
            const Icon = trustIcons[i];
            return (
              <div key={pt.title} className="flex items-start gap-3">
                <Icon size={20} className="mt-0.5 shrink-0 text-brand-red" />
                <div>
                  <p className="text-sm font-semibold text-ink">{pt.title}</p>
                  <p className="text-xs text-ink-soft">{pt.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-10">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold text-ink">{t.home.shopByCategory}</h2>
          <Link href="/products" className="flex items-center gap-1 text-sm font-medium text-brand-red hover:underline">
            {t.home.viewAll} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((c) => {
            const Icon = categoryIcons[c.slug] || Wrench;
            return (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                className="group relative overflow-hidden rounded-xl border border-surface-border bg-surface p-5 text-center shadow-soft transition-shadow hover:shadow-card"
              >
                <span className="absolute inset-x-0 top-0 h-1 bg-brand-red opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-red-light text-brand-red group-hover:bg-brand-red group-hover:text-white">
                  <Icon size={20} />
                </div>
                <p className="text-sm font-semibold text-ink">{c.name}</p>
                <p className="mt-0.5 text-xs text-ink-soft">{c.productCount.toLocaleString()} {t.home.partsSuffix}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Tabbed product showcase */}
      <section className="bg-surface py-10">
        <div className="container-page">
          <ProductTabs tabs={tabs} />
        </div>
      </section>

      {/* Promo banners */}
      <section className="container-page py-10">
        <PromoBanners />
      </section>

      {/* About + supported vehicle makes */}
      <section className="bg-surface py-10">
        <div className="container-page grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-red">
              <Image src="/emblem-red.png" alt="" width={900} height={945} className="h-4 w-auto" />
              {t.home.aboutBadge}
            </span>
            <h2 className="mb-4 font-display text-2xl font-bold text-ink sm:text-3xl">{t.home.aboutTitle}</h2>
            <p className="mb-3 text-sm leading-relaxed text-ink-soft">{t.home.aboutP1}</p>
            <p className="text-sm leading-relaxed text-ink-soft">{t.home.aboutP2}</p>
          </div>
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">{t.home.makesLabel}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {supportedMakes.map((make) => (
                <div
                  key={make}
                  className="flex items-center justify-center rounded-lg border border-surface-border bg-surface-muted px-3 py-5 text-center text-sm font-semibold text-ink-soft transition-colors hover:border-brand-red hover:text-brand-red"
                >
                  {make}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Brands */}
      {brands.length > 0 && (
        <section className="bg-ink py-10">
          <div className="container-page mb-6 flex items-end justify-between">
            <div>
              <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-wide text-brand-red-light">
                {t.home.brandsBadge}
              </span>
              <h2 className="font-display text-2xl font-bold text-white">{t.home.brandsTitle}</h2>
            </div>
            <Link href="/products" className="hidden items-center gap-1 text-sm font-medium text-white/70 hover:text-white sm:flex">
              {t.home.shopAllBrands} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="group/marquee relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
            <div className="animate-marquee flex w-max gap-4">
              {brandMarquee.map((b, i) => (
                <Link
                  key={`${b.id}-${i}`}
                  href={`/products?brand=${b.slug}`}
                  className="flex h-20 w-44 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-center text-base font-semibold text-white/60 grayscale transition-all hover:border-brand-red/60 hover:bg-white/10 hover:text-white hover:grayscale-0"
                >
                  {b.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Request a part CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-red to-brand-red-dark">
        <Image
          src="/emblem-white.png"
          alt=""
          width={900}
          height={945}
          aria-hidden
          className="pointer-events-none absolute -left-16 top-1/2 hidden w-80 -translate-y-1/2 opacity-[0.12] sm:block"
        />
        <div className="container-page relative flex flex-col items-center gap-4 py-10 text-center">
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">{t.home.ctaTitle}</h2>
          <p className="max-w-md text-sm text-white/80">{t.home.ctaDesc}</p>
          <Link href="/request-part" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand-red hover:bg-white/90">
            {t.home.ctaButton}
          </Link>
        </div>
      </section>
    </div>
  );
}
