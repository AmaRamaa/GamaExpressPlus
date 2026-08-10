// Canonical production origin, used for sitemap/robots/OG/canonical URLs.
// Override via NEXT_PUBLIC_SITE_URL if the domain ever changes.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://gama-express-plus.vercel.app").replace(/\/+$/, "");

export const SITE_BUSINESS_NAME = "Gama Express Sh.p.k.";
export const SITE_BUSINESS_NUMBER = "810100587";

export const SITE_PHONE_PRIMARY = "+383 44 100 531";
export const SITE_PHONE_PRIMARY_TEL = "+38344100531";
export const SITE_PHONE_SECONDARY = "+383 48 100 531";
export const SITE_PHONE_SECONDARY_TEL = "+38348100531";
export const SITE_EMAIL = "GamaExpress18@gmail.com";
export const SITE_WHATSAPP_URL = "https://wa.me/38344100531";

export const SITE_LOCATIONS = [
  { label: "Fushë Kosovë / Prishtinë", mapsUrl: "https://maps.app.goo.gl/RjS2rSFe2Zyq4oqr8" },
  { label: "Prizren", mapsUrl: "https://maps.app.goo.gl/fAGUU7BTC2wdEUyN8" },
];
