"use client";

import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="font-display text-2xl font-bold text-ink">Add product</h1>
      <ProductForm />
    </div>
  );
}
