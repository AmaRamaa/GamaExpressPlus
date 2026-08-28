import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import { stripAiPrefix } from "@/lib/adapters";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/+$/, "");

type ProductImage = {
  url: string;
  altText?: string | null;
  sortOrder?: number;
};

type ProductDetail = {
  title: string;
  shortDescription: string | null;
  description: string | null;
  sku: string;
  partNumber: string;
  oemNumbers: string[];
  priceEur: number;
  discountPriceEur: number | null;
  stockStatus: string;
  images: ProductImage[];
  brand: { name: string } | null;
  category: { name: string } | null;
};

async function getProduct(slug: string): Promise<ProductDetail | null> {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const product = (await res.json()) as ProductDetail;
    // This fetches straight from the API, bypassing lib/adapters.ts's
    // mapProduct -- strip the "[AI] " review marker here too, or it'd leak
    // into the page <title>, meta description, OG tags and JSON-LD.
    return { ...product, title: stripAiPrefix(product.title) };
  } catch {
    return null;
  }
}

function buildDescription(product: ProductDetail): string {
  if (product.shortDescription) return product.shortDescription;
  if (product.description) return product.description.slice(0, 155);
  const brand = product.brand?.name;
  const category = product.category?.name;
  const parts = [product.title];
  if (brand) parts.push(`by ${brand}`);
  if (category) parts.push(`in ${category}`);
  return `${parts.join(" ")} — available at Gama Express.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Part Not Found",
    };
  }

  const title = product.brand?.name ? `${product.title} | ${product.brand.name}` : product.title;
  const description = buildDescription(product);
  const ogImage = product.images?.[0]?.url || "/emblem-red.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [ogImage],
      type: "website",
    },
    alternates: {
      canonical: `${SITE_URL}/products/${slug}`,
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return <>{children}</>;
  }

  const description = buildDescription(product);
  const availability =
    product.stockStatus === "IN_STOCK"
      ? "https://schema.org/InStock"
      : product.stockStatus === "OUT_OF_STOCK"
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/LimitedAvailability";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description,
    sku: product.sku,
    mpn: product.partNumber,
    brand: {
      "@type": "Brand",
      name: product.brand?.name,
    },
    image: product.images?.map((image) => image.url) || [],
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: String(product.discountPriceEur ?? product.priceEur),
      availability,
      url: `${SITE_URL}/products/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
