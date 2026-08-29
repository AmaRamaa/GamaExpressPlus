"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductForm, type ProductFormValues } from "@/components/admin/ProductForm";
import { api, ApiError } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";

interface Submission {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  locationCompany: string | null;
}

function NewProductPageContent() {
  const router = useRouter();
  const token = useAdminStore((s) => s.token);
  const submissionId = useSearchParams().get("fromSubmission");

  const [initial, setInitial] = useState<Partial<ProductFormValues> | undefined>(undefined);
  const [loading, setLoading] = useState(!!submissionId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!submissionId) return;
    api
      .get<Submission>(`/submissions/${submissionId}`, token)
      .then((s) => {
        setInitial({
          title: s.title,
          shortDescription: s.description || "",
          images: s.images.map((url) => ({ url, altText: "" })),
          ...(s.locationCompany ? { locationCompany: s.locationCompany } : {}),
        });
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load submission"))
      .finally(() => setLoading(false));
  }, [submissionId, token]);

  async function handleSaved(product?: any) {
    if (submissionId && product?.id) {
      try {
        await api.post(`/submissions/${submissionId}/promote`, { productId: product.id }, token);
      } catch {
        // The product was still created successfully -- a failed link-back
        // just means the submission stays in its current status in the
        // review queue instead of moving to Promoted. Not worth blocking on.
      }
    }
    router.push("/admin/products");
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="font-display text-2xl font-bold text-ink">
        {submissionId ? "Promote submission to product" : "Add product"}
      </h1>
      {submissionId && (
        <p className="-mt-2 text-sm text-ink-soft">
          Pre-filled from a customer submission — fill in brand, category, part number and price to publish it.
        </p>
      )}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-ink-soft">Loading…</p>
      ) : (
        <ProductForm initial={initial} onSaved={handleSaved} />
      )}
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">Loading…</p>}>
      <NewProductPageContent />
    </Suspense>
  );
}
