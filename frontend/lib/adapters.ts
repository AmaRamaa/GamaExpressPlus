import type { Product, Brand, Category } from "./types";

// Converts the backend's raw Prisma-shaped product (relations included) into
// the flatter Product type the storefront UI was built against.
export function mapProduct(raw: any): Product {
  return {
    id: raw.id,
    sku: raw.sku,
    slug: raw.slug,
    title: raw.title,
    shortDescription: raw.shortDescription || "",
    description: raw.description || "",
    technicalInfo: raw.technicalInfo || undefined,
    installationNotes: raw.installationNotes || undefined,
    categorySlug: raw.category?.slug || "",
    categoryName: raw.category?.name || "",
    brand: {
      id: raw.brand?.id,
      name: raw.brand?.name || "Unknown",
      slug: raw.brand?.slug || "",
      isOEM: raw.brand?.isOEM,
    },
    oemNumbers: raw.oemNumbers || [],
    partNumber: raw.partNumber,
    priceEur: raw.priceEur,
    discountPriceEur: raw.discountPriceEur ?? undefined,
    stockStatus: raw.stockStatus,
    stockQuantity: raw.stockQuantity,
    rating: raw.rating ?? 0,
    reviewCount: raw.reviewCount ?? 0,
    compatibleEngineIds: (raw.compatibility || []).map((c: any) => c.engineId ?? c.engine?.id).filter(Boolean),
    isFeatured: raw.isFeatured,
    imageUrl: raw.images?.[0]?.url || undefined,
  };
}

export function mapBrand(raw: any): Brand {
  return { id: raw.id, name: raw.name, slug: raw.slug, isOEM: raw.isOEM };
}

export function mapCategory(raw: any): Category {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    icon: raw.icon,
    productCount: raw._count?.products ?? raw.productCount ?? 0,
  };
}
