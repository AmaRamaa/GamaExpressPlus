"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { Product } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useAdminStore } from "@/lib/admin-store";
import { api, ApiError } from "@/lib/api";
import { PartCode, StockBadge } from "./ui-bits";
import ProductVisual from "./ProductVisual";
import ProductPrice from "./ProductPrice";
import QuickviewModal from "./QuickviewModal";
import { useT } from "@/lib/i18n";
import { localizeProductText } from "@/lib/adapters";
import clsx from "clsx";

interface CategoryOption {
  id: string;
  name: string;
}

export default function ProductCard({ product, layout = "grid" }: { product: Product; layout?: "grid" | "list" }) {
  const addToCart = useStore((s) => s.addToCart);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const isWishlisted = useStore((s) => s.wishlist.includes(product.id));
  const [quickviewOpen, setQuickviewOpen] = useState(false);
  const { t, locale } = useT();
  const { title } = localizeProductText(product, locale);

  // Admin-only quick edit: right-click a product anywhere on the site to
  // rename it or move it to a different category, right in place -- no
  // dialog, no trip to the admin panel. Never shown to regular visitors.
  const adminUser = useAdminStore((s) => s.user);
  const adminToken = useAdminStore((s) => s.token);
  const isAdmin = adminUser?.role === "ADMIN" || adminUser?.role === "SUPER_ADMIN";

  const [titleOverride, setTitleOverride] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [editingField, setEditingField] = useState<"title" | "category" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [quickEditError, setQuickEditError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const displayTitle = titleOverride ?? title;

  useEffect(() => {
    if (!contextMenu && editingField === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setContextMenu(null);
        setEditingField(null);
      }
    }
    // mousedown (not click) fires before the menu's own onClick handlers,
    // so this must check whether the click originated inside the menu --
    // relying on the inner button's stopPropagation instead raced this
    // listener and could unmount the menu (and the button mid-click) before
    // its click event ever fired.
    function onClickAway(e: MouseEvent) {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setContextMenu(null);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickAway);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickAway);
    };
  }, [contextMenu, editingField]);

  function handleContextMenu(e: React.MouseEvent) {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    setQuickEditError("");
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  function startEditTitle() {
    setEditValue(displayTitle);
    setEditingField("title");
    setContextMenu(null);
  }

  async function startEditCategory() {
    setEditingField("category");
    setEditValue(product.categoryId || "");
    if (categories.length === 0) {
      try {
        setCategories(await api.get<CategoryOption[]>("/catalog/categories?includeInternal=true"));
      } catch {
        // fall through -- the picker will just show no options, not a crash
      }
    }
  }

  async function saveTitle() {
    const next = editValue.trim();
    setEditingField(null);
    if (!next || next === displayTitle) return;
    setSaving(true);
    setQuickEditError("");
    try {
      await api.put(`/products/${product.id}`, { title: next }, adminToken);
      setTitleOverride(next);
    } catch (err) {
      setQuickEditError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function saveCategory(categoryId: string) {
    setEditingField(null);
    setContextMenu(null);
    if (!categoryId || categoryId === product.categoryId) return;
    setSaving(true);
    setQuickEditError("");
    try {
      await api.put(`/products/${product.id}`, { categoryId }, adminToken);
    } catch (err) {
      setQuickEditError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const quickEditMenu = isAdmin && (contextMenu || editingField === "category") && (
    <div
      ref={menuRef}
      className="fixed z-50 rounded-lg border border-surface-border bg-surface p-1 shadow-lifted"
      style={{ left: contextMenu?.x ?? 0, top: contextMenu?.y ?? 0 }}
    >
      {editingField === "category" ? (
        <div className="w-56 p-2">
          <label className="mb-1 block text-xs font-medium text-ink-soft">Move to category</label>
          <select
            autoFocus
            value={editValue}
            disabled={saving}
            onChange={(e) => saveCategory(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface px-2 py-1.5 text-sm text-ink outline-none focus:border-brand-red"
          >
            <option value="">Select category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <button type="button" onClick={startEditTitle} className="block w-full whitespace-nowrap rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted">
            Edit name
          </button>
          <button type="button" onClick={startEditCategory} className="block w-full whitespace-nowrap rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted">
            Edit category
          </button>
        </>
      )}
    </div>
  );

  if (layout === "list") {
    return (
      <div className="group/row relative flex items-center gap-3 rounded-lg border border-surface-border bg-surface px-3 py-2 shadow-soft transition-shadow hover:shadow-card" onContextMenu={handleContextMenu}>
        {/* No thumbnail in the line itself -- hovering the row floats the
            photo above it instead, so the list stays dense by default. */}
        <div className="pointer-events-none absolute -top-2 left-3 z-20 hidden -translate-y-full overflow-hidden rounded-lg border border-surface-border bg-surface shadow-lifted group-hover/row:block">
          <div className="size-40">
            <ProductVisual categorySlug={product.categorySlug} imageUrl={product.imageUrl} fit="contain" />
          </div>
        </div>

        {quickviewOpen && <QuickviewModal product={product} onClose={() => setQuickviewOpen(false)} />}
        {quickEditMenu}

        <StockBadge status={product.stockStatus} />

        {editingField === "title" ? (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === "Enter" && saveTitle()}
            disabled={saving}
            className="min-w-0 flex-1 rounded border border-brand-red bg-surface px-1.5 py-0.5 text-sm text-ink outline-none"
          />
        ) : (
          <Link href={`/products/${product.slug}`} className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink group-hover/row:text-brand-red">{displayTitle}</span>
          </Link>
        )}

        <span className="hidden shrink-0 text-xs uppercase tracking-wide text-ink-soft md:block">{product.brand.name}</span>
        <span className="hidden shrink-0 sm:block"><PartCode label="Part No.">{product.partNumber}</PartCode></span>

        <div className="shrink-0"><ProductPrice product={product} /></div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => toggleWishlist(product.id)}
            aria-label={isWishlisted ? t.common.removeFromFavorites : t.common.saveToFavorites}
            className="rounded-full p-2 text-ink-soft hover:bg-surface-muted"
          >
            <Heart size={15} className={clsx(isWishlisted ? "fill-brand-red text-brand-red" : "")} />
          </button>
          <button
            onClick={() => addToCart(product)}
            disabled={product.stockStatus === "OUT_OF_STOCK"}
            aria-label={t.common.addToCart}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red text-white transition-colors hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:bg-surface-border"
          >
            <ShoppingCart size={14} />
          </button>
        </div>
        {quickEditError && <p className="absolute -bottom-5 left-3 text-xs text-red-600">{quickEditError}</p>}
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col rounded-xl border border-surface-border bg-surface p-4 shadow-soft transition-shadow hover:shadow-card" onContextMenu={handleContextMenu}>
      <button
        onClick={() => toggleWishlist(product.id)}
        aria-label={isWishlisted ? t.common.removeFromFavorites : t.common.saveToFavorites}
        className="absolute right-3 top-3 z-10 rounded-full bg-surface/90 p-2 shadow-soft transition-colors hover:bg-surface"
      >
        <Heart size={16} className={clsx(isWishlisted ? "fill-brand-red text-brand-red" : "text-ink-soft")} />
      </button>

      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative mb-3 aspect-square overflow-hidden rounded-lg">
          <ProductVisual categorySlug={product.categorySlug} imageUrl={product.imageUrl} fit="contain" className="transition-transform duration-300 group-hover:scale-105" />

          {/* Hover overlay: quickview, matching Riardi's on-hover product actions */}
          <button
            onClick={(e) => { e.preventDefault(); setQuickviewOpen(true); }}
            className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-1.5 bg-ink/85 py-2.5 text-xs font-semibold text-white opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
          >
            <Eye size={14} /> {t.common.quickview}
          </button>
        </div>
      </Link>

      {quickviewOpen && <QuickviewModal product={product} onClose={() => setQuickviewOpen(false)} />}
      {quickEditMenu}

      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">{product.brand.name}</span>
        <StockBadge status={product.stockStatus} />
      </div>

      {editingField === "title" ? (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => e.key === "Enter" && saveTitle()}
          disabled={saving}
          className="mb-1.5 w-full rounded border border-brand-red bg-surface px-1.5 py-1 text-sm text-ink outline-none"
        />
      ) : (
        <Link href={`/products/${product.slug}`}>
          <h3 className="mb-1.5 line-clamp-2 font-display text-base font-semibold leading-snug text-ink hover:text-brand-red">
            {displayTitle}
          </h3>
        </Link>
      )}

      <div className="mb-2">
        <PartCode label="Part No.">{product.partNumber}</PartCode>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <ProductPrice product={product} />
        <button
          onClick={() => addToCart(product)}
          disabled={product.stockStatus === "OUT_OF_STOCK"}
          aria-label={t.common.addToCart}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-red text-white transition-colors hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:bg-surface-border"
        >
          <ShoppingCart size={16} />
        </button>
      </div>
      {quickEditError && <p className="mt-1 text-xs text-red-600">{quickEditError}</p>}
    </div>
  );
}
