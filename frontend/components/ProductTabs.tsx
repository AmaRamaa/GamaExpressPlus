"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

interface Tab {
  label: string;
  products: Product[];
  viewAllHref: string;
}

export default function ProductTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(0);
  const current = tabs[active];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-surface-border">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActive(i)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                active === i ? "border-brand-red text-brand-red" : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Link href={current.viewAllHref} className="mb-2 flex items-center gap-1 text-sm font-medium text-brand-red hover:underline">
          View all <ArrowRight size={14} />
        </Link>
      </div>

      {current.products.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-soft">No products in this section yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {current.products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
