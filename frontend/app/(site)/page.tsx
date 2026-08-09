import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Truck,
  Wrench,
  Headset,
  ArrowRight,
  CarFront,
  Lightbulb,
  Frame,
  PanelTop,
} from "lucide-react";
import VehicleFinder from "@/components/VehicleFinder";
import ProductTabs from "@/components/ProductTabs";
import PromoBanners from "@/components/PromoBanners";
import { api } from "@/lib/api";
import { mapProduct, mapBrand, mapCategory } from "@/lib/adapters";
import type { Category, Brand } from "@/lib/types";

// This page fetches live catalog data (products, categories, brands admins
// can change at any time). Rendering it dynamically per-request, rather
// than Next's default of freezing it as static HTML at build time, keeps
// it showing current data and means the build itself never depends on the
// backend being reachable at that exact moment.
export const dynamic = "force-dynamic";

interface ProductListResponse {
  items: any[];
}

async function getProductsByCategory(categorySlug: string, limit = 8) {
  const res = await api.get<ProductListResponse>(`/products?category=${categorySlug}&limit=${limit}`);
  return res.items.map(mapProduct);
}

async function getFeaturedProducts(limit = 8) {
  const res = await api.get<ProductListResponse>(`/products?featured=true&limit=${limit}`);
  return res.items.map(mapProduct);
}

const categoryIcons: Record<string, typeof Wrench> = {
  "bumpers-body-panels": CarFront,
  "lighting": Lightbulb,
  "mirrors-glass": Frame,
  "trim-grilles": PanelTop,
};

const trustPoints = [
  { icon: ShieldCheck, title: "Verified fitment", desc: "Every part matched to your exact model year and variant" },
  { icon: Truck, title: "Fast Kosovo delivery", desc: "Same-day dispatch from our Prishtinë warehouse" },
  { icon: Wrench, title: "Genuine & aftermarket", desc: "OEM and trusted aftermarket brands side by side" },
  { icon: Headset, title: "Real support", desc: "Talk to someone who knows the parts catalog" },
];

export default async function HomePage() {
  const [featured, bumperProducts, lightingProducts, mirrorProducts, rawCategories, rawBrands, rawMakes] =
    await Promise.all([
      getFeaturedProducts(),
      getProductsByCategory("bumpers-body-panels"),
      getProductsByCategory("lighting"),
      getProductsByCategory("mirrors-glass"),
      api.get<any[]>("/catalog/categories"),
      api.get<any[]>("/catalog/brands"),
      api.get<any[]>("/vehicles/makes"),
    ]);

  const categories: Category[] = rawCategories.map(mapCategory);
  // "oemtest" is leftover seed/test data, not a real brand — never show it.
  const brands: Brand[] = rawBrands.filter((b: any) => b.slug !== "oemtest").map(mapBrand);
  const brandMarquee = brands.length > 0 ? [...brands, ...brands] : [];
  const supportedMakes: string[] = rawMakes.slice(0, 12).map((m: any) => m.name);

  const tabs = [
    { label: "New Arrivals", products: featured, viewAllHref: "/products?sort=newest" },
    { label: "Bumpers & Body Panels", products: bumperProducts, viewAllHref: "/products?category=bumpers-body-panels" },
    { label: "Lighting", products: lightingProducts, viewAllHref: "/products?category=lighting" },
    { label: "Mirrors & Glass", products: mirrorProducts, viewAllHref: "/products?category=mirrors-glass" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-surface-border bg-gradient-to-br from-ink via-ink to-brand-red-dark">
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="#FFFFFF" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
        {/* Repeating logo watermark */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "url(/emblem-white.png)", backgroundSize: "110px auto", backgroundRepeat: "repeat" }}
          aria-hidden
        />
        <Image
          src="/emblem-white.png"
          alt=""
          width={900}
          height={945}
          aria-hidden
          className="pointer-events-none absolute -right-24 top-1/2 hidden w-[440px] -translate-y-1/2 opacity-[0.10] lg:block"
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-brand-red/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-[360px] w-[360px] rounded-full bg-white/[0.06] blur-3xl" />

        <div className="container-page relative grid gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-14">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-brand-red px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-lifted">
              <Image src="/emblem-white.png" alt="" width={900} height={945} className="h-3.5 w-auto" />
              Gama Express &middot; Kosovo's exterior parts catalog
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              The right body part,<br />matched to your <span className="text-brand-red-light">exact vehicle.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-white/70">
              Search by OEM number, or your vehicle's manufacturer, model, and year. Thousands of genuine and
              aftermarket bumpers, lights, mirrors, glass, and trim, verified for fitment before they ship.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/products" className="rounded-lg bg-brand-red px-5 py-3 text-sm font-semibold text-white shadow-lifted hover:bg-brand-red-dark">
                Browse all parts
              </Link>
              <Link href="/vehicle-finder" className="rounded-lg border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur hover:border-white hover:bg-white/10">
                Open Vehicle Finder
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
          {trustPoints.map((t) => (
            <div key={t.title} className="flex items-start gap-3">
              <t.icon size={20} className="mt-0.5 shrink-0 text-brand-red" />
              <div>
                <p className="text-sm font-semibold text-ink">{t.title}</p>
                <p className="text-xs text-ink-soft">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-10">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold text-ink">Shop by category</h2>
          <Link href="/products" className="flex items-center gap-1 text-sm font-medium text-brand-red hover:underline">
            View all <ArrowRight size={14} />
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
                <p className="mt-0.5 text-xs text-ink-soft">{c.productCount.toLocaleString()} parts</p>
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
              About Gama Express
            </span>
            <h2 className="mb-4 font-display text-2xl font-bold text-ink sm:text-3xl">
              Kosovo's catalog for genuine and aftermarket exterior parts
            </h2>
            <p className="mb-3 text-sm leading-relaxed text-ink-soft">
              Gama Express supplies drivers, garages, and businesses across Kosovo with body parts matched
              precisely to their vehicle — not just the model, but the exact generation and body style.
            </p>
            <p className="text-sm leading-relaxed text-ink-soft">
              From bumpers and body panels to headlights, mirrors, glass, and trim, every listing on our
              catalog is checked against real fitment data before it reaches your cart. We work with
              individual customers and body shops alike, offering wholesale pricing and bulk quotes for
              businesses that need parts at scale.
            </p>
          </div>
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">Parts available for these makes</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
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
                Official parts distributor
              </span>
              <h2 className="font-display text-2xl font-bold text-white">Brands Gama Express carries</h2>
            </div>
            <Link href="/products" className="hidden items-center gap-1 text-sm font-medium text-white/70 hover:text-white sm:flex">
              Shop all brands <ArrowRight size={14} />
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
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Can't find the part you need?</h2>
          <p className="max-w-md text-sm text-white/80">
            Tell us the vehicle and part description — our sourcing team will track it down and get back to you.
          </p>
          <Link href="/request-part" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand-red hover:bg-white/90">
            Request a part
          </Link>
        </div>
      </section>
    </div>
  );
}
