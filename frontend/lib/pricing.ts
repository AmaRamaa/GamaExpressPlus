import { AuthUser, Product } from "./types";

export function getEffectivePrice(product: Product, user: AuthUser | null) {
  const listPrice = product.priceEur;
  const catalogPrice = product.discountPriceEur ?? product.priceEur;

  if (user && user.discountPercent > 0) {
    const finalPrice = Math.round(catalogPrice * (1 - user.discountPercent / 100) * 100) / 100;
    return { finalPrice, listPrice, isMemberPrice: true };
  }

  return { finalPrice: catalogPrice, listPrice, isMemberPrice: false };
}
