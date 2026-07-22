"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Clock, TrendingUp } from "lucide-react";
import { products, popularSearches } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { getEffectivePrice } from "@/lib/pricing";
import { PartCode, SignInForPrice } from "./ui-bits";

export default function SearchBar() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return products
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.partNumber.toLowerCase().includes(q) ||
          p.oemNumbers.some((o) => o.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [query]);

  function submitSearch(term: string) {
    if (!term.trim()) return;
    setRecent((prev) => [term, ...prev.filter((t) => t !== term)].slice(0, 5));
    setFocused(false);
    router.push(`/products?q=${encodeURIComponent(term)}`);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`flex items-center gap-2 rounded-lg border bg-surface px-3.5 py-2.5 shadow-soft transition-colors ${focused
            ? "border-brand-red"
            : "border-surface-border"
          }`}
      >
        <Search size={18} className="shrink-0 text-ink-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => e.key === "Enter" && submitSearch(query)}
          placeholder="Search by part name or OEM number…"
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-0"
        />
      </div>

      {focused && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-surface-border bg-surface shadow-lifted">
          {suggestions.length > 0 ? (
            <ul className="divide-y divide-surface-border">
              {suggestions.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/products/${p.slug}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink">{p.title}</p>
                      <PartCode label="Part No.">{p.partNumber}</PartCode>
                    </div>
                    {user ? (
                      <span className="text-sm font-semibold text-brand-red">
                        €{getEffectivePrice(p, user).finalPrice.toFixed(2)}
                      </span>
                    ) : (
                      <SignInForPrice size="xs" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4">
              {recent.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    <Clock size={12} /> Recent searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((term) => (
                      <button
                        key={term}
                        onClick={() => submitSearch(term)}
                        className="rounded-full border border-surface-border px-3 py-1 text-xs text-ink hover:border-brand-red hover:text-brand-red"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  <TrendingUp size={12} /> Popular searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => submitSearch(term)}
                      className="rounded-full border border-surface-border px-3 py-1 text-xs text-ink hover:border-brand-red hover:text-brand-red"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}