"use client";

import { Product } from "@/lib/types";
import { useStore } from "@/lib/store";
import { getEffectivePrice } from "@/lib/pricing";
import { PriceTag, SignInForPrice } from "./ui-bits";

export default function ProductPrice({ product }: { product: Product }) {
  const user = useStore((s) => s.user);

  if (!user) return <SignInForPrice />;

  const { finalPrice, listPrice, isMemberPrice } = getEffectivePrice(product, user);
  return (
    <PriceTag
      price={listPrice}
      discountPrice={finalPrice < listPrice ? finalPrice : undefined}
      badge={isMemberPrice ? `Member −${user.discountPercent}%` : undefined}
    />
  );
}
