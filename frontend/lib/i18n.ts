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
    common: {
      signInForPrice: "Kyçu për çmimin",
      quickview: "Shikim i shpejtë",
      addToCart: "Shto në shportë",
      saveToFavorites: "Ruaj në të preferuarat",
      removeFromFavorites: "Hiq nga të preferuarat",
      inStock: "Në stok",
      lowStock: "Stok i kufizuar",
      outOfStock: "Jashtë stokut",
      backorder: "Me porosi",
    },
    home: {
      badge: "Gama Express · Katalogu i pjesëve eksterne të Kosovës",
      heroTitle1: "Pjesa e saktë e karrocerisë,",
      heroTitle2: "e përshtatur me automjetin tënd të",
      heroTitleHighlight: "saktë.",
      heroDesc:
        "Kërko sipas numrit OEM, ose prodhuesit, modelit dhe vitit të automjetit tënd. Mijëra parakolpa, drita, pasqyra, xhama dhe zbukurime origjinale dhe alternative, të verifikuara për përputhje para se të dërgohen.",
      browseAll: "Shfleto të gjitha pjesët",
      openFinder: "Hap Gjetësin e Automjetit",
      trust: [
        { title: "Përputhje e verifikuar", desc: "Çdo pjesë e përshtatur me modelin dhe vitin tënd të saktë" },
        { title: "Dërgesë e shpejtë në Kosovë", desc: "Dërgim po të njëjtën ditë nga depoja jonë në Prishtinë" },
        { title: "Origjinale & alternative", desc: "Marka OEM dhe alternative të besueshme krah për krah" },
        { title: "Mbështetje reale", desc: "Bisedo me dikë që njeh katalogun e pjesëve" },
      ],
      shopByCategory: "Blej sipas kategorisë",
      viewAll: "Shiko të gjitha",
      partsSuffix: "pjesë",
      aboutBadge: "Rreth Gama Express",
      aboutTitle: "Katalogu i Kosovës për pjesë origjinale dhe alternative eksterne",
      aboutP1:
        "Gama Express furnizon shoferë, servise dhe biznese në të gjithë Kosovën me pjesë karrocerie të përshtatura saktësisht me automjetin e tyre — jo vetëm modelin, por gjeneratën dhe stilin e saktë të karrocerisë.",
      aboutP2:
        "Nga parakolpat dhe panelet e karrocerisë te dritat, pasqyrat, xhamat dhe zbukurimet, çdo artikull në katalogun tonë kontrollohet kundrejt të dhënave reale të përputhjes para se të arrijë në shportën tënde. Punojmë me klientë individualë dhe servise auto njësoj, duke ofruar çmime me shumicë dhe oferta për biznese që kanë nevojë për pjesë në sasi të mëdha.",
      makesLabel: "Pjesë të disponueshme për këto marka",
      brandsBadge: "Shpërndarës zyrtar pjesësh",
      brandsTitle: "Markat që ofron Gama Express",
      shopAllBrands: "Shiko të gjitha markat",
      ctaTitle: "Nuk gjen pjesën që të duhet?",
      ctaDesc: "Na trego automjetin dhe përshkrimin e pjesës — ekipi ynë i furnizimit do ta gjejë dhe do të kthehet tek ti.",
      ctaButton: "Kërko një pjesë",
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
    common: {
      signInForPrice: "Sign in for price",
      quickview: "Quickview",
      addToCart: "Add to cart",
      saveToFavorites: "Save to favorites",
      removeFromFavorites: "Remove from favorites",
      inStock: "In stock",
      lowStock: "Low stock",
      outOfStock: "Out of stock",
      backorder: "Backorder",
    },
    home: {
      badge: "Gama Express · Kosovo's exterior parts catalog",
      heroTitle1: "The right body part,",
      heroTitle2: "matched to your",
      heroTitleHighlight: "exact vehicle.",
      heroDesc:
        "Search by OEM number, or your vehicle's manufacturer, model, and year. Thousands of genuine and aftermarket bumpers, lights, mirrors, glass, and trim, verified for fitment before they ship.",
      browseAll: "Browse all parts",
      openFinder: "Open Vehicle Finder",
      trust: [
        { title: "Verified fitment", desc: "Every part matched to your exact model year and variant" },
        { title: "Fast Kosovo delivery", desc: "Same-day dispatch from our Prishtinë warehouse" },
        { title: "Genuine & aftermarket", desc: "OEM and trusted aftermarket brands side by side" },
        { title: "Real support", desc: "Talk to someone who knows the parts catalog" },
      ],
      shopByCategory: "Shop by category",
      viewAll: "View all",
      partsSuffix: "parts",
      aboutBadge: "About Gama Express",
      aboutTitle: "Kosovo's catalog for genuine and aftermarket exterior parts",
      aboutP1:
        "Gama Express supplies drivers, garages, and businesses across Kosovo with body parts matched precisely to their vehicle — not just the model, but the exact generation and body style.",
      aboutP2:
        "From bumpers and body panels to headlights, mirrors, glass, and trim, every listing on our catalog is checked against real fitment data before it reaches your cart. We work with individual customers and body shops alike, offering wholesale pricing and bulk quotes for businesses that need parts at scale.",
      makesLabel: "Parts available for these makes",
      brandsBadge: "Official parts distributor",
      brandsTitle: "Brands Gama Express carries",
      shopAllBrands: "Shop all brands",
      ctaTitle: "Can't find the part you need?",
      ctaDesc: "Tell us the vehicle and part description — our sourcing team will track it down and get back to you.",
      ctaButton: "Request a part",
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
