import type { Product, Brand, Category } from "./types";
import type { Locale } from "./i18n";

// Mirrors backend/src/routes/products.ts's AI_PREFIX -- the two codebases
// don't share a module, so this has to stay in sync by hand. It marks a
// title the AI auto-complete flow filled in that's still awaiting human
// review; stripped from the display title everywhere and surfaced instead
// as Product.isAiSuggested for a small "AI" tag under the title.
const AI_PREFIX = "[AI] ";
export function stripAiPrefix(title: string): string {
  return title.startsWith(AI_PREFIX) ? title.slice(AI_PREFIX.length) : title;
}

// Converts the backend's raw Prisma-shaped product (relations included) into
// the flatter Product type the storefront UI was built against.
export function mapProduct(raw: any): Product {
  const rawTitle: string = raw.title || "";
  return {
    id: raw.id,
    sku: raw.sku,
    slug: raw.slug,
    title: stripAiPrefix(rawTitle),
    isAiSuggested: rawTitle.startsWith(AI_PREFIX),
    shortDescription: raw.shortDescription || "",
    description: raw.description || "",
    contentLanguage: raw.contentLanguage ?? null,
    shortDescriptionLanguage: raw.shortDescriptionLanguage ?? null,
    descriptionLanguage: raw.descriptionLanguage ?? null,
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
    locationCompany: raw.locationCompany || "Gama Express SH.P.K",
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
    imageUrl: raw.imageUrl || undefined,
    productCount: raw._count?.products ?? raw.productCount ?? 0,
  };
}

// Picks the right title/shortDescription/description for the visitor's
// current site locale, field by field: a field's original text if it's
// already in that locale (or hasn't been translated yet), otherwise its
// translated counterpart -- falling back to the original if a translation
// is still missing rather than showing blank text. Fields are judged
// separately because a listing can mix languages (Albanian title, English
// AI-written description); products translated before per-field detection
// have null field languages and fall back to the title's language, which is
// exactly how they behaved before.
export function localizeProductText(
  product: Pick<
    Product,
    | "title"
    | "shortDescription"
    | "description"
    | "contentLanguage"
    | "shortDescriptionLanguage"
    | "descriptionLanguage"
    | "titleTranslated"
    | "shortDescriptionTranslated"
    | "descriptionTranslated"
  >,
  locale: Locale
): { title: string; shortDescription: string; description: string } {
  const pick = (
    original: string,
    translated: string | null | undefined,
    fieldLanguage: "SQ" | "EN" | null | undefined
  ) => {
    const language = fieldLanguage ?? product.contentLanguage;
    if (!language || language.toLowerCase() === locale) return original;
    return translated || original;
  };
  return {
    title: stripAiPrefix(pick(product.title, product.titleTranslated, product.contentLanguage)),
    shortDescription: pick(product.shortDescription, product.shortDescriptionTranslated, product.shortDescriptionLanguage),
    description: pick(product.description, product.descriptionTranslated, product.descriptionLanguage),
  };
}
