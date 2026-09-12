import { api } from "@/lib/api";
import { mapProduct, mapBrand, mapCategory } from "@/lib/adapters";
import type { Category, Brand } from "@/lib/types";
import HomeContent from "@/components/home/HomeContent";

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

  const mappedCategories: Category[] = rawCategories.map(mapCategory);
  // Categories without a manually-set image (Admin > Categories) fall back
  // to a photo of one of their own products, so the homepage grid never
  // shows a bare icon for a category that actually has products in it.
  const categories: Category[] = await Promise.all(
    mappedCategories.map(async (c) => {
      if (c.imageUrl || c.productCount === 0) return c;
      try {
        const sample = await getProductsByCategory(c.slug, 1);
        const imageUrl = sample[0]?.imageUrl;
        return imageUrl ? { ...c, imageUrl } : c;
      } catch {
        return c;
      }
    })
  );
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
    <HomeContent
      tabs={tabs}
      categories={categories}
      brands={brands}
      brandMarquee={brandMarquee}
      supportedMakes={supportedMakes}
    />
  );
}
