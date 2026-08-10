import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

// Build-time-safe API base: resolved directly from process.env rather than
// via lib/api.ts's request() wrapper, since that wrapper is designed for
// client/runtime calls and this generator must degrade gracefully if the
// backend is unreachable during a Vercel build.
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/+$/, "");

type ProductListItem = {
  slug: string;
  updatedAt?: string;
  createdAt?: string;
};

type ProductListResponse = {
  items: ProductListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

async function fetchAllProducts(): Promise<ProductListItem[]> {
  const items: ProductListItem[] = [];
  let page = 1;

  // The backend caps `limit` at 100 per page regardless of what's requested,
  // so a full catalog listing requires walking `totalPages`.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await fetch(`${API_URL}/products?limit=1000&page=${page}`, {
      // Sitemap content doesn't need to be perfectly fresh; allow caching
      // between builds/revalidations rather than forcing a dynamic fetch.
      next: { revalidate: 3600 },
    });

    if (!res.ok) break;

    const data: ProductListResponse = await res.json();
    items.push(...data.items);

    if (page >= data.totalPages || data.items.length === 0) break;
    page += 1;
  }

  return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1.0 },
    { url: `${SITE_URL}/products`, lastModified: now, priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/business`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/contact`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/faq`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/shipping`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/returns`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/request-part`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/vehicle-finder`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/careers`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/privacy`, lastModified: now, priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, priority: 0.3 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];

  try {
    const products = await fetchAllProducts();
    productRoutes = products.map((product) => ({
      url: `${SITE_URL}/products/${product.slug}`,
      lastModified: product.updatedAt
        ? new Date(product.updatedAt)
        : product.createdAt
          ? new Date(product.createdAt)
          : now,
      priority: 0.7,
    }));
  } catch {
    // Backend unreachable at build time (e.g. Railway cold start/outage) --
    // fall back to static routes only rather than failing the whole
    // Vercel deploy over a sitemap.
    productRoutes = [];
  }

  return [...staticRoutes, ...productRoutes];
}
