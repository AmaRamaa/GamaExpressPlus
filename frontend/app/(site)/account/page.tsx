"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Package, Car, Heart, MapPin, User, LogOut } from "lucide-react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { mapProduct } from "@/lib/adapters";
import { StockBadge } from "@/components/ui-bits";
import ProductVisual from "@/components/ProductVisual";
import ProductPrice from "@/components/ProductPrice";
import type { Product } from "@/lib/types";

interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  totalEur: number;
  createdAt: string;
  items: { id: string }[];
}

interface AddressRow {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  city: string;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
}

const sections = [
  { id: "orders", label: "Order history", icon: Package },
  { id: "vehicles", label: "My vehicles", icon: Car },
  { id: "wishlist", label: "Favorites", icon: Heart },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "profile", label: "Profile", icon: User },
] as const;

type SectionId = (typeof sections)[number]["id"];

function AccountPageContent() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab: SectionId = sections.some((s) => s.id === requestedTab) ? (requestedTab as SectionId) : "orders";
  const [active, setActive] = useState<SectionId>(initialTab);
  const wishlistIds = useStore((s) => s.wishlist);
  const vehicle = useStore((s) => s.vehicle);
  const user = useStore((s) => s.user);
  const token = useStore((s) => s.token);
  const logout = useStore((s) => s.logout);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!token) return;
    api.get<OrderRow[]>("/orders", token).then(setOrders).catch(() => {});
    api.get<AddressRow[]>("/addresses", token).then(setAddresses).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (wishlistIds.length === 0) {
      setWishlistProducts([]);
      return;
    }
    api
      .get<{ items: any[] }>(`/products?ids=${wishlistIds.join(",")}&limit=${wishlistIds.length}`)
      .then((res) => setWishlistProducts(res.items.map(mapProduct)))
      .catch(() => setWishlistProducts([]));
  }, [wishlistIds]);

  if (!user) {
    return (
      <div className="container-page py-16 text-center">
        <p className="font-display text-xl font-semibold text-ink">Sign in to view your account</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
          Order history, saved vehicles, favorites, and your account's pricing live here once you're signed in.
        </p>
        <Link href="/login" className="mt-5 inline-block rounded-lg bg-brand-red px-5 py-3 text-sm font-semibold text-white hover:bg-brand-red-dark">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">My account</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Signed in as {user.name}
            {user.discountPercent > 0 && (
              <span className="ml-2 rounded-full bg-brand-red-light px-2 py-0.5 text-xs font-semibold text-brand-red">
                {user.accountLabel || "Member"} · {user.discountPercent}% off
              </span>
            )}
          </p>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-brand-red">
          <LogOut size={14} /> Sign out
        </button>
      </div>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                active === s.id ? "bg-brand-red-light text-brand-red" : "text-ink-soft hover:bg-surface-muted"
              }`}
            >
              <s.icon size={16} /> {s.label}
            </button>
          ))}
        </aside>

        <div>
          {active === "orders" && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <p className="text-sm text-ink-soft">No orders yet.</p>
              ) : (
                orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-xl border border-surface-border bg-surface p-4 shadow-soft">
                    <div>
                      <p className="part-code text-sm font-medium text-ink">{o.orderNumber}</p>
                      <p className="text-xs text-ink-soft">{new Date(o.createdAt).toLocaleDateString()} · {o.items.length} item(s)</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="rounded-full bg-success-light px-2.5 py-1 text-xs font-medium text-success">{o.status}</span>
                      <span className="text-sm font-semibold text-ink">€{o.totalEur.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {active === "vehicles" && (
            <div>
              {vehicle ? (
                <div className="flex items-center justify-between rounded-xl border border-surface-border bg-surface p-4 shadow-soft">
                  <div>
                    <p className="font-semibold text-ink">{vehicle.makeName} {vehicle.modelName}</p>
                    <p className="text-xs text-ink-soft">{vehicle.generationName} · {vehicle.year}{vehicle.variant ? ` · ${vehicle.variant}` : ""}</p>
                  </div>
                  <span className="rounded-full bg-success-light px-2.5 py-1 text-xs font-medium text-success">Default</span>
                </div>
              ) : (
                <p className="text-sm text-ink-soft">
                  No vehicle saved yet. Use the <Link href="/vehicle-finder" className="text-brand-red hover:underline">Vehicle Finder</Link> to add your car.
                </p>
              )}
            </div>
          )}

          {active === "wishlist" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {wishlistProducts.length === 0 ? (
                <p className="text-sm text-ink-soft">No favorites saved yet.</p>
              ) : (
                wishlistProducts.map((p) => (
                  <div key={p.id} className="rounded-xl border border-surface-border bg-surface p-3 shadow-soft">
                    <div className="relative mb-2 aspect-square overflow-hidden rounded-lg">
                      <ProductVisual categorySlug={p.categorySlug} variant="secondary" />
                    </div>
                    <Link href={`/products/${p.slug}`} className="line-clamp-2 text-sm font-medium text-ink hover:text-brand-red">{p.title}</Link>
                    <div className="mt-1"><ProductPrice product={p} /></div>
                    <div className="mt-1"><StockBadge status={p.stockStatus} /></div>
                  </div>
                ))
              )}
            </div>
          )}

          {active === "addresses" && (
            <div className="space-y-3">
              {addresses.length === 0 ? (
                <p className="text-sm text-ink-soft">No addresses saved yet.</p>
              ) : (
                addresses.map((a) => (
                  <div key={a.id} className="rounded-xl border border-surface-border bg-surface p-4 shadow-soft">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink">{a.label}</p>
                      {a.isDefault && <span className="rounded-full bg-brand-red-light px-2 py-0.5 text-[10px] font-semibold text-brand-red">Default</span>}
                    </div>
                    <p className="text-sm text-ink-soft">{a.addressLine1}, {a.postalCode ? `${a.postalCode} ` : ""}{a.city}, {a.country}</p>
                    <p className="text-xs text-ink-soft">{a.fullName} · {a.phone}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {active === "profile" && (
            <div className="max-w-md space-y-4 rounded-xl border border-surface-border bg-surface p-5 shadow-soft">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Full name</label>
                <input defaultValue={user.name} disabled className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-ink-soft" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Email</label>
                <input defaultValue={user.email} disabled className="w-full rounded-lg border border-surface-border bg-surface-muted px-3 py-2 text-sm text-ink-soft" />
              </div>
              <p className="text-xs text-ink-soft">Contact us to update your account details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="container-page py-16 text-center text-ink-soft">Loading…</div>}>
      <AccountPageContent />
    </Suspense>
  );
}
