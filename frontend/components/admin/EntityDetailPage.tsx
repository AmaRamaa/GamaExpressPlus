"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { api } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Entity {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  imageUrl?: string | null;
  isOEM?: boolean;
  productCount: number;
}

interface ProductRow {
  id: string;
  title: string;
  sku: string;
  priceEur: number;
  stockStatus: string;
  images: { url: string }[];
}

const stockVariant: Record<string, "success" | "destructive" | "secondary"> = {
  IN_STOCK: "success",
  LOW_STOCK: "secondary",
  OUT_OF_STOCK: "destructive",
  BACKORDER: "secondary",
  DISCONTINUED: "destructive",
};

export function EntityDetailPage({
  apiPath,
  id,
  entityLabel,
  filterParam,
  backLink,
}: {
  apiPath: string;
  id: string;
  entityLabel: string;
  filterParam: "brandId" | "categoryId" | "manufacturerId";
  backLink: string;
}) {
  const token = useAdminStore((s) => s.token);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<Entity>(`${apiPath}/${id}`),
      api.get<{ items: ProductRow[] }>(`/admin/products?${filterParam}=${id}&limit=100`, token),
    ])
      .then(([e, p]) => {
        setEntity(e);
        setProducts(p.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiPath, id, filterParam, token]);

  if (loading) return <p className="text-sm text-ink-soft">Loading…</p>;
  if (!entity) return <p className="text-sm text-ink-soft">{entityLabel} not found.</p>;

  const image = entity.logoUrl || entity.imageUrl;

  return (
    <div className="space-y-6">
      <Link href={backLink} className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft size={14} /> Back to {entityLabel}s
      </Link>

      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-14 rounded-lg border border-slate-100 object-contain p-1" />
        ) : (
          <div className="flex size-14 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
            <Package size={20} />
          </div>
        )}
        <div>
          <h1 className="font-display text-xl font-bold text-ink">{entity.name}</h1>
          <p className="text-sm text-ink-soft">
            /{entity.slug} · {entity.productCount} product{entity.productCount === 1 ? "" : "s"}
            {entity.isOEM && (
              <>
                {" "}
                · <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">OEM</span>
              </>
            )}
          </p>
          {entity.description && <p className="mt-1 text-sm text-ink-soft">{entity.description}</p>}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0].url} alt="" className="size-9 rounded object-contain" />
                  ) : (
                    <div className="size-9 rounded bg-slate-100" />
                  )}
                </TableCell>
                <TableCell>
                  <Link href={`/admin/products/${p.id}`} className="font-medium text-ink hover:text-brand-red hover:underline">
                    {p.title}
                  </Link>
                </TableCell>
                <TableCell className="part-code text-ink-soft">{p.sku}</TableCell>
                <TableCell>€{p.priceEur.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={stockVariant[p.stockStatus] || "secondary"}>{p.stockStatus.replace(/_/g, " ")}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-ink-soft">
                  No products linked to this {entityLabel} yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
