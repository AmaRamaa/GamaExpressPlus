import { Brand, Category, DemoAccount, Product, VehicleMake } from "./types";

// Prototype-only demo accounts — there is no self-signup, accounts like these
// are set up by the Gama Express team (see /business). Plaintext passwords are
// fine here only because this is mock client-side data, not real auth.
export const demoAccounts: DemoAccount[] = [
  { id: "u1", email: "arben.k@example.com", password: "demo1234", name: "Arben Krasniqi", discountPercent: 0 },
  { id: "u2", email: "service@prishtinaauto.example", password: "demo1234", name: "Prishtina Auto Service", discountPercent: 15, accountLabel: "Wholesale account" },
  { id: "u3", email: "loyal@example.com", password: "demo1234", name: "Fatmir Berisha", discountPercent: 5, accountLabel: "Loyalty member" },
];

export const categories: Category[] = [
  { id: "c1", name: "Bumpers & Body Panels", slug: "bumpers-body-panels", productCount: 412 },
  { id: "c2", name: "Lighting", slug: "lighting", productCount: 268 },
  { id: "c3", name: "Mirrors & Glass", slug: "mirrors-glass", productCount: 194 },
  { id: "c4", name: "Exterior Trim & Grilles", slug: "trim-grilles", productCount: 156 },
];

export const brands: Brand[] = [
  { id: "b1", name: "TYC", slug: "tyc" },
  { id: "b2", name: "Van Wezel", slug: "van-wezel" },
  { id: "b3", name: "Febi Bilstein", slug: "febi-bilstein" },
  { id: "b4", name: "Blic", slug: "blic" },
  { id: "b5", name: "Valeo", slug: "valeo" },
  { id: "b6", name: "Magneti Marelli", slug: "magneti-marelli" },
  { id: "b7", name: "Pilkington", slug: "pilkington" },
  { id: "b8", name: "Depo", slug: "depo" },
];

export interface MegaMenuGroup {
  name: string;
  slug: string;
  icon: string; // lucide icon key, resolved in components/icon-map.ts
  subcategories: { name: string; slug: string }[];
}

export const megaMenu: MegaMenuGroup[] = [
  {
    name: "Bumpers & Body Panels", slug: "bumpers-body-panels", icon: "CarFront",
    subcategories: [
      { name: "Front Bumpers", slug: "front-bumpers" },
      { name: "Rear Bumpers", slug: "rear-bumpers" },
      { name: "Fenders", slug: "fenders" },
      { name: "Hoods & Bonnets", slug: "hoods-bonnets" },
      { name: "Side Skirts", slug: "side-skirts" },
    ],
  },
  {
    name: "Lighting", slug: "lighting", icon: "Lightbulb",
    subcategories: [
      { name: "Headlights", slug: "headlights" },
      { name: "Taillights", slug: "taillights" },
      { name: "Fog Lights", slug: "fog-lights" },
      { name: "LED Kits", slug: "led-kits" },
      { name: "Turn Signal Lenses", slug: "turn-signal-lenses" },
    ],
  },
  {
    name: "Mirrors & Glass", slug: "mirrors-glass", icon: "Frame",
    subcategories: [
      { name: "Side Mirrors", slug: "side-mirrors" },
      { name: "Mirror Glass", slug: "mirror-glass" },
      { name: "Windshields", slug: "windshields" },
      { name: "Door Glass", slug: "door-glass" },
      { name: "Mirror Covers", slug: "mirror-covers" },
    ],
  },
  {
    name: "Exterior Trim & Grilles", slug: "trim-grilles", icon: "PanelTop",
    subcategories: [
      { name: "Front Grilles", slug: "front-grilles" },
      { name: "Spoilers", slug: "spoilers" },
      { name: "Body Moldings", slug: "body-moldings" },
      { name: "Emblems & Badges", slug: "emblems-badges" },
      { name: "Wheel Arch Trim", slug: "wheel-arch-trim" },
    ],
  },
];

export const vehicleMakes: VehicleMake[] = [
  {
    id: "audi", name: "Audi", color: "#1A1A1A",
    models: [
      {
        id: "a3", name: "A3",
        generations: [
          {
            id: "a3-8v-sportsback", name: "8V Sportsback (2012–2016)", yearFrom: 2012, yearTo: 2016, bodyType: "Sportsback",
            engines: [
              { id: "a3-8v-sb-20tdi", engineCode: "CRBC", displacementL: 2.0, fuelType: "DIESEL", horsePowerHp: 150, transmission: "MANUAL" },
              { id: "a3-8v-sb-14tsi", engineCode: "CZDA", displacementL: 1.4, fuelType: "PETROL", horsePowerHp: 125, transmission: "AUTOMATIC" },
            ],
          },
          {
            id: "a3-8v-sedan", name: "8V Sedan (2013–2016)", yearFrom: 2013, yearTo: 2016, bodyType: "Sedan",
            engines: [
              { id: "a3-8v-sd-20tdi", engineCode: "CRBC", displacementL: 2.0, fuelType: "DIESEL", horsePowerHp: 150, transmission: "MANUAL" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "vw", name: "Volkswagen", color: "#001E50",
    models: [
      {
        id: "golf", name: "Golf",
        generations: [
          {
            id: "golf-mk7", name: "Mk7 (2012–2020)", yearFrom: 2012, yearTo: 2020, bodyType: "Hatchback",
            engines: [
              { id: "golf-mk7-20tdi", engineCode: "CRBC", displacementL: 2.0, fuelType: "DIESEL", horsePowerHp: 150, transmission: "MANUAL" },
              { id: "golf-mk7-16tdi", engineCode: "CXXB", displacementL: 1.6, fuelType: "DIESEL", horsePowerHp: 105, transmission: "MANUAL" },
              { id: "golf-mk7-14tsi", engineCode: "CZDA", displacementL: 1.4, fuelType: "PETROL", horsePowerHp: 125, transmission: "AUTOMATIC" },
            ],
          },
          {
            id: "golf-mk6", name: "Mk6 (2008–2013)", yearFrom: 2008, yearTo: 2013, bodyType: "Hatchback",
            engines: [
              { id: "golf-mk6-20tdi", engineCode: "CBDB", displacementL: 2.0, fuelType: "DIESEL", horsePowerHp: 140, transmission: "MANUAL" },
            ],
          },
        ],
      },
      {
        id: "passat", name: "Passat",
        generations: [
          {
            id: "passat-b8", name: "B8 (2014–2023)", yearFrom: 2014, yearTo: 2023, bodyType: "Saloon",
            engines: [
              { id: "passat-b8-20tdi", engineCode: "DFHA", displacementL: 2.0, fuelType: "DIESEL", horsePowerHp: 190, transmission: "AUTOMATIC" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "bmw", name: "BMW", color: "#1C69D4",
    models: [
      {
        id: "3series", name: "3 Series",
        generations: [
          {
            id: "f30", name: "F30 (2012–2019)", yearFrom: 2012, yearTo: 2019, bodyType: "Saloon",
            engines: [
              { id: "f30-320d", engineCode: "N47D20C", displacementL: 2.0, fuelType: "DIESEL", horsePowerHp: 184, transmission: "AUTOMATIC" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "mercedes", name: "Mercedes-Benz", color: "#6B7280",
    models: [
      {
        id: "cclass", name: "C-Class",
        generations: [
          {
            id: "w205", name: "W205 (2014–2021)", yearFrom: 2014, yearTo: 2021, bodyType: "Saloon",
            engines: [
              { id: "w205-220d", engineCode: "OM651", displacementL: 2.1, fuelType: "DIESEL", horsePowerHp: 170, transmission: "AUTOMATIC" },
            ],
          },
        ],
      },
    ],
  },
];

const golfMk7Engines = ["golf-mk7-20tdi", "golf-mk7-16tdi", "golf-mk7-14tsi"];

export const products: Product[] = [
  {
    id: "p1", sku: "GE-BMP-0001", slug: "front-bumper-cover-primed-vw-golf-mk7",
    title: "Front Bumper Cover (Primed) – VW Golf Mk7",
    shortDescription: "Direct-fit primed front bumper cover, ready for paint-matching.",
    description: "OE-shaped replacement front bumper cover for pre-facelift and facelift Golf Mk7 trims. Supplied primed and ready for paint to match your vehicle's factory colour code.",
    technicalInfo: "Material: PP/EPDM plastic blend. Supplied unpainted (primed). Includes mounting tabs and fog light cutouts.",
    installationNotes: "Test-fit before painting. Reuse the OEM brackets and impact absorber from the old bumper unless damaged.",
    categorySlug: "bumpers-body-panels", categoryName: "Bumpers & Body Panels",
    brand: brands[1], oemNumbers: ["5G0807221", "5G0807221GRU"], partNumber: "VW-5837",
    priceEur: 189.0, stockStatus: "IN_STOCK", stockQuantity: 14,
    rating: 4.5, reviewCount: 33, compatibleEngineIds: golfMk7Engines, isFeatured: true,
  },
  {
    id: "p2", sku: "GE-BMP-0002", slug: "rear-bumper-cover-primed-passat-b8",
    title: "Rear Bumper Cover (Primed) – Passat B8",
    shortDescription: "Primed rear bumper cover matched to factory mounting points.",
    description: "Direct-fit rear bumper cover for the Passat B8, supplied primed with pre-cut sensor and exhaust trim openings where applicable.",
    categorySlug: "bumpers-body-panels", categoryName: "Bumpers & Body Panels",
    brand: brands[3], oemNumbers: ["3G6807421"], partNumber: "BL-5506-00-2621950P",
    priceEur: 224.0, discountPriceEur: 199.0, stockStatus: "LOW_STOCK", stockQuantity: 3,
    rating: 4.3, reviewCount: 11, compatibleEngineIds: ["passat-b8-20tdi"],
  },
  {
    id: "p3", sku: "GE-FND-0001", slug: "front-fender-right-vw-golf-mk7",
    title: "Front Fender (RH) – VW Golf Mk7",
    shortDescription: "Bolt-on replacement front fender panel, OE profile.",
    description: "Galvanised steel fender panel matched to Golf Mk7 body lines. Bolt-on installation using factory fixing points — no welding required.",
    categorySlug: "bumpers-body-panels", categoryName: "Bumpers & Body Panels",
    brand: brands[1], oemNumbers: ["5G0821106"], partNumber: "VW-4173",
    priceEur: 96.5, stockStatus: "IN_STOCK", stockQuantity: 21,
    rating: 4.6, reviewCount: 18, compatibleEngineIds: golfMk7Engines,
  },
  {
    id: "p4", sku: "GE-HOD-0001", slug: "bonnet-hood-panel-vw-golf-mk6",
    title: "Bonnet / Hood Panel – VW Golf Mk6",
    shortDescription: "Direct-fit steel bonnet panel matching factory contours.",
    description: "OE-shaped replacement bonnet for the Golf Mk6, supplied unpainted with hinge and latch mounting points pre-drilled.",
    categorySlug: "bumpers-body-panels", categoryName: "Bumpers & Body Panels",
    brand: brands[2], oemNumbers: ["1K0823031"], partNumber: "FEBI-45678",
    priceEur: 178.0, stockStatus: "OUT_OF_STOCK", stockQuantity: 0,
    rating: 4.2, reviewCount: 7, compatibleEngineIds: ["golf-mk6-20tdi"],
  },
  {
    id: "p5", sku: "GE-LGT-0001", slug: "headlight-assembly-left-bmw-f30-320d",
    title: "Headlight Assembly (LH, Halogen) – BMW F30 320d",
    shortDescription: "Complete halogen headlight unit, plug-and-play fit.",
    description: "Direct-replacement halogen headlight assembly for the F30 3 Series, matched to factory beam pattern and connector layout.",
    categorySlug: "lighting", categoryName: "Lighting",
    brand: brands[0], oemNumbers: ["63117338993"], partNumber: "TYC-20-14471-05-2",
    priceEur: 142.0, discountPriceEur: 119.0, stockStatus: "IN_STOCK", stockQuantity: 16,
    rating: 4.7, reviewCount: 52, compatibleEngineIds: ["f30-320d"], isFeatured: true,
  },
  {
    id: "p6", sku: "GE-LGT-0002", slug: "led-taillight-set-vw-golf-mk7",
    title: "LED Taillight Set – VW Golf Mk7",
    shortDescription: "Dynamic LED taillight pair with factory-style light signature.",
    description: "Full LED taillight upgrade set for the Golf Mk7, replicating the factory light signature with a plug-and-play harness.",
    categorySlug: "lighting", categoryName: "Lighting",
    brand: brands[7], oemNumbers: ["5G0945207", "5G0945208"], partNumber: "DEPO-441-1985",
    priceEur: 165.0, stockStatus: "IN_STOCK", stockQuantity: 25,
    rating: 4.8, reviewCount: 74, compatibleEngineIds: golfMk7Engines, isFeatured: true,
  },
  {
    id: "p7", sku: "GE-MIR-0001", slug: "side-mirror-housing-right-heated-vw-golf-mk7",
    title: "Side Mirror Housing (RH, Electric, Heated) – VW Golf Mk7",
    shortDescription: "Complete power-fold, heated mirror housing, primed for paint.",
    description: "Direct-fit replacement side mirror assembly with electric adjustment and heating element, primed and ready for paint.",
    categorySlug: "mirrors-glass", categoryName: "Mirrors & Glass",
    brand: brands[2], oemNumbers: ["5G0857508"], partNumber: "FEBI-102938",
    priceEur: 88.0, stockStatus: "IN_STOCK", stockQuantity: 30,
    rating: 4.4, reviewCount: 29, compatibleEngineIds: golfMk7Engines,
  },
  {
    id: "p8", sku: "GE-GLS-0001", slug: "front-windshield-laminated-passat-b8",
    title: "Front Windshield (Laminated) – Passat B8",
    shortDescription: "OE-spec laminated windshield with correct optical clarity.",
    description: "Laminated safety glass windshield matched to Passat B8 sensor bracket and mounting geometry, including ADAS camera bracket where fitted.",
    categorySlug: "mirrors-glass", categoryName: "Mirrors & Glass",
    brand: brands[6], oemNumbers: ["3G8845099"], partNumber: "PGW-FW04944GBN",
    priceEur: 245.0, stockStatus: "LOW_STOCK", stockQuantity: 2,
    rating: 4.9, reviewCount: 14, compatibleEngineIds: ["passat-b8-20tdi"],
  },
  {
    id: "p9", sku: "GE-GRL-0001", slug: "front-grille-gloss-black-bmw-f30",
    title: "Front Grille (Gloss Black) – BMW F30",
    shortDescription: "Direct-fit kidney grille pair in gloss black finish.",
    description: "Bolt-on replacement front grille set for the F30 3 Series, finished in gloss black with OE-matching clip layout.",
    categorySlug: "trim-grilles", categoryName: "Exterior Trim & Grilles",
    brand: brands[5], oemNumbers: ["51137260493"], partNumber: "MM-GRL-3401",
    priceEur: 112.0, stockStatus: "IN_STOCK", stockQuantity: 19,
    rating: 4.5, reviewCount: 21, compatibleEngineIds: ["f30-320d"],
  },
  {
    id: "p10", sku: "GE-SPL-0001", slug: "rear-roof-spoiler-vw-golf-mk7",
    title: "Rear Roof Spoiler – VW Golf Mk7",
    shortDescription: "Unpainted ABS roof spoiler with factory mounting profile.",
    description: "Direct-fit ABS roof spoiler matched to the Golf Mk7 hatchback roofline, supplied unpainted with factory-style adhesive mounting.",
    categorySlug: "trim-grilles", categoryName: "Exterior Trim & Grilles",
    brand: brands[1], oemNumbers: [], partNumber: "VW-SPL-7719",
    priceEur: 79.0, discountPriceEur: 64.0, stockStatus: "IN_STOCK", stockQuantity: 40,
    rating: 4.3, reviewCount: 16, compatibleEngineIds: golfMk7Engines, isFeatured: true,
  },
  {
    id: "p11", sku: "GE-BMP-0003", slug: "front-bumper-cover-primed-audi-a3-8v-sportsback",
    title: "Front Bumper Cover (Primed) – Audi A3 8V Sportsback",
    shortDescription: "Direct-fit primed front bumper cover for the A3 8V Sportsback.",
    description: "OE-shaped replacement front bumper cover matched to the A3 8V Sportsback's fascia. Supplied primed and ready for paint.",
    categorySlug: "bumpers-body-panels", categoryName: "Bumpers & Body Panels",
    brand: brands[1], oemNumbers: ["8V0807221"], partNumber: "VW-6031",
    priceEur: 205.0, stockStatus: "IN_STOCK", stockQuantity: 9,
    rating: 4.4, reviewCount: 6, compatibleEngineIds: ["a3-8v-sb-20tdi", "a3-8v-sb-14tsi"],
  },
  {
    id: "p12", sku: "GE-MIR-0002", slug: "side-mirror-housing-left-heated-audi-a3-8v-sportsback",
    title: "Side Mirror Housing (LH, Electric, Heated) – Audi A3 8V Sportsback",
    shortDescription: "Complete power-fold, heated mirror housing, primed for paint.",
    description: "Direct-fit replacement side mirror assembly with electric adjustment and heating element for the A3 8V Sportsback, primed and ready for paint.",
    categorySlug: "mirrors-glass", categoryName: "Mirrors & Glass",
    brand: brands[2], oemNumbers: ["8V0857507"], partNumber: "FEBI-103871",
    priceEur: 92.0, stockStatus: "IN_STOCK", stockQuantity: 17,
    rating: 4.5, reviewCount: 9, compatibleEngineIds: ["a3-8v-sb-20tdi", "a3-8v-sb-14tsi"],
  },
];

export function getFeaturedProducts() {
  return products.filter((p) => p.isFeatured);
}

export function getEngineIdsForGeneration(generationId: string): string[] {
  for (const make of vehicleMakes) {
    for (const model of make.models) {
      const generation = model.generations.find((g) => g.id === generationId);
      if (generation) return generation.engines.map((e) => e.id);
    }
  }
  return [];
}

export function getProductsByGeneration(generationId: string) {
  const engineIds = getEngineIdsForGeneration(generationId);
  return products.filter((p) => p.compatibleEngineIds.some((id) => engineIds.includes(id)));
}

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export const popularSearches = ["Front bumper", "Headlight assembly", "Side mirror", "Windshield", "Front grille"];

export function getProductsByCategory(slug: string) {
  return products.filter((p) => p.categorySlug === slug);
}

export const supportedMakes = [
  "Volkswagen", "BMW", "Mercedes-Benz", "Audi", "Škoda", "Opel",
  "Renault", "Peugeot", "Toyota", "Ford", "Fiat", "Hyundai",
];

