import {
  SITE_URL,
  SITE_BUSINESS_NAME,
  SITE_PHONE_PRIMARY,
  SITE_EMAIL,
  SITE_LOCATIONS,
} from "@/lib/constants";

export default function LocalBusinessJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoPartsStore",
    name: SITE_BUSINESS_NAME,
    url: SITE_URL,
    telephone: SITE_PHONE_PRIMARY,
    email: SITE_EMAIL,
    image: `${SITE_URL}/emblem-red.png`,
    areaServed: "Kosovo",
    location: SITE_LOCATIONS.map((loc) => ({
      "@type": "Place",
      name: loc.label,
      hasMap: loc.mapsUrl,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
