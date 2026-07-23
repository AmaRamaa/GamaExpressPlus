"use client";

import { useStore } from "./store";

export type Locale = "sq" | "en";

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "sq", label: "SQ" },
  { code: "en", label: "EN" },
];

const dict = {
  sq: {
    header: {
      location: "Prishtinë, Kosovë",
      vehicleFinder: "Gjej Automjetin",
      businessAccounts: "Llogari biznesi",
      trackOrder: "Gjurmo porosinë",
      signIn: "Kyçu",
      favorites: "Të preferuarat",
      cart: "Shporta",
      newArrivals: "Të Rejat",
      sale: "Zbritje",
    },
    vehicleFinder: {
      title: "Gjej pjesë për automjetin tënd",
      manufacturer: "Prodhuesi",
      model: "Modeli",
      carYear: "Viti i makinës",
      showParts: "Shfaq pjesët e përshtatshme",
      produced: "Prodhuar",
      yearNotCovered: "Ky vit nuk mbulohet për këtë model. Prodhuar",
    },
    footer: {
      shop: "Blej",
      customerCare: "Kujdesi ndaj klientit",
      business: "Biznes",
      company: "Kompania",
      tagline:
        "Pjesë origjinale dhe alternative eksterne për automjete, të dërguara në të gjithë Kosovën — shpejt, me përputhje të verifikuar, marka të besueshme.",
      rights: "Të gjitha të drejtat e rezervuara.",
      shopLinks: ["Parakolpa & Panele", "Ndriçim", "Pasqyra & Xhama", "Zbukurime & Grila"],
      careLinks: ["Gjurmo porosinë", "Kthime & garanci", "Kërko një pjesë", "Info dërgese", "Pyetje të shpeshta"],
      businessLinks: ["Llogari me shumicë", "Kërko ofertë me shumicë", "Faturimi", "Degët"],
      companyLinks: ["Rreth Gama Express", "Blogu automotiv", "Karriera", "Na kontaktoni"],
    },
  },
  en: {
    header: {
      location: "Prishtinë, Kosovë",
      vehicleFinder: "Vehicle Finder",
      businessAccounts: "Business accounts",
      trackOrder: "Track order",
      signIn: "Sign in",
      favorites: "Favorites",
      cart: "Cart",
      newArrivals: "New Arrivals",
      sale: "Sale",
    },
    vehicleFinder: {
      title: "Find parts for your vehicle",
      manufacturer: "Manufacturer",
      model: "Model",
      carYear: "Car year",
      showParts: "Show compatible parts",
      produced: "Produced",
      yearNotCovered: "That year isn't covered for this model. Produced",
    },
    footer: {
      shop: "Shop",
      customerCare: "Customer Care",
      business: "Business",
      company: "Company",
      tagline:
        "Genuine and aftermarket exterior auto parts, delivered across Kosovo — fast, verified fitment, trusted brands.",
      rights: "All rights reserved.",
      shopLinks: ["Bumpers & Body Panels", "Lighting", "Mirrors & Glass", "Exterior Trim & Grilles"],
      careLinks: ["Track your order", "Returns & warranty", "Request a part", "Shipping info", "FAQ"],
      businessLinks: ["Wholesale accounts", "Bulk quote request", "Invoicing", "Branch locations"],
      companyLinks: ["About Gama Express", "Automotive blog", "Careers", "Contact us"],
    },
  },
} as const;

export type Dict = typeof dict.en;

export function useT() {
  const locale = useStore((s) => s.locale);
  const setLocale = useStore((s) => s.setLocale);
  return { t: dict[locale], locale, setLocale };
}
