export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  productCount: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  isOEM?: boolean;
}

export interface VehicleEngine {
  id: string;
  engineCode: string;
  displacementL: number;
  fuelType: "PETROL" | "DIESEL" | "HYBRID" | "ELECTRIC";
  horsePowerHp: number;
  transmission: "MANUAL" | "AUTOMATIC" | "CVT";
}

export interface VehicleGeneration {
  id: string;
  name: string;
  yearFrom: number;
  yearTo?: number;
  bodyType?: string;
  engines: VehicleEngine[];
}

export interface VehicleModel {
  id: string;
  name: string;
  generations: VehicleGeneration[];
}

export interface VehicleMake {
  id: string;
  name: string;
  color?: string;
  logoUrl?: string;
  models: VehicleModel[];
}

export interface SelectedVehicle {
  makeId: string;
  makeName: string;
  modelId: string;
  modelName: string;
  generationId: string;
  generationName: string;
  variant?: string;
  year: number;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  // Whichever language title/shortDescription/description were originally
  // entered in, plus the auto-generated counterpart in the other language --
  // null/undefined until the translation service has run on this product.
  contentLanguage?: "SQ" | "EN" | null;
  titleTranslated?: string | null;
  shortDescriptionTranslated?: string | null;
  descriptionTranslated?: string | null;
  technicalInfo?: string;
  installationNotes?: string;
  categorySlug: string;
  categoryName: string;
  brand: Brand;
  oemNumbers: string[];
  partNumber: string;
  priceEur: number;
  discountPriceEur?: number;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "BACKORDER";
  stockQuantity: number;
  rating: number;
  reviewCount: number;
  compatibleEngineIds: string[];
  isFeatured?: boolean;
  imageUrl?: string;
  imageUrls?: string[];
}

export interface CartLine {
  product: Product;
  quantity: number;
}

export interface DemoAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  discountPercent: number;
  accountLabel?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  discountPercent: number;
  accountLabel?: string;
}
