import type { Product, Brand, Category } from "./types";
import type { Locale } from "./i18n";

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
    contentLanguage: raw.contentLanguage ?? null,
    titleTranslated: raw.titleTranslated ?? null,
    shortDescriptionTranslated: raw.shortDescriptionTranslated ?? null,
    descriptionTranslated: raw.descriptionTranslated ?? null,
    technicalInfo: raw.technicalInfo || undefined,
    installationNotes: raw.installationNotes || undefined,
    categoryId: raw.category?.id || raw.categoryId || undefined,
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
    imageUrls: (raw.images || []).map((img: any) => img.url).filter(Boolean),
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

// Picks the right title/shortDescription/description for the visitor's
// current site locale: the original text if it already matches (or the
// product hasn't been translated yet), otherwise the translated
// counterpart -- falling back to the original if a translation is still
// missing rather than showing blank text.
export function localizeProductText(
  product: Pick<Product, "title" | "shortDescription" | "description" | "contentLanguage" | "titleTranslated" | "shortDescriptionTranslated" | "descriptionTranslated">,
  locale: Locale
): { title: string; shortDescription: string; description: string } {
  const isOriginalLocale = !product.contentLanguage || product.contentLanguage.toLowerCase() === locale;
  if (isOriginalLocale) {
    return { title: product.title, shortDescription: product.shortDescription, description: product.description };
  }
  return {
    title: product.titleTranslated || product.title,
    shortDescription: product.shortDescriptionTranslated || product.shortDescription,
    description: product.descriptionTranslated || product.description,
  };
}
