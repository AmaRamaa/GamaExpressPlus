"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Clock, TrendingUp, Tags, FolderTree, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { getEffectivePrice } from "@/lib/pricing";
import { PartCode, CallForQuote } from "./ui-bits";

interface SuggestedProduct {
  id: string;
  title: string;
  slug: string;
  priceEur: number;
  discountPriceEur: number | null;
  partNumber: string;
}
interface SuggestedTag {
  id: string;
  name: string;
  slug: string;
}
interface SuggestResponse {
  products: SuggestedProduct[];
  categories: SuggestedTag[];
  brands: SuggestedTag[];
}

export default function SearchBar() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const token = useStore((s) => s.token);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedProduct[]>([]);
  const [categoryMatches, setCategoryMatches] = useState<SuggestedTag[]>([]);
  const [brandMatches, setBrandMatches] = useState<SuggestedTag[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [popular, setPopular] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<string[]>("/search/popular").then(setPopular).catch(() => {});
    if (token) {
      api.get<string[]>("/search/recent", token).then(setRecent).catch(() => {});
    }
  }, [token]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setCategoryMatches([]);
      setBrandMatches([]);
      return;
    }
    const handle = setTimeout(() => {
      api
        .get<SuggestResponse>(`/search/suggest?q=${encodeURIComponent(query)}`)
        .then((res) => {
          setSuggestions(res.products.slice(0, 5));
          setCategoryMatches(res.categories.slice(0, 3));
          setBrandMatches(res.brands.slice(0, 3));
        })
        .catch(() => {
          setSuggestions([]);
          setCategoryMatches([]);
          setBrandMatches([]);
        });
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  const hasAnyMatch = suggestions.length > 0 || categoryMatches.length > 0 || brandMatches.length > 0;

  function submitSearch(term: string) {
    if (!term.trim()) return;
    setRecent((prev) => [term, ...prev.filter((t) => t !== term)].slice(0, 5));
    setFocused(false);
    api.post("/search/track", { query: term }, token).catch(() => {});
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
          {query.trim().length >= 2 ? (
            hasAnyMatch ? (
              <div>
                {(categoryMatches.length > 0 || brandMatches.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 border-b border-surface-border p-3">
                    {categoryMatches.map((c) => (
                      <Link
                        key={c.id}
                        href={`/products?category=${c.slug}`}
                        className="flex items-center gap-1 rounded-full border border-surface-border px-2.5 py-1 text-xs text-ink hover:border-brand-red hover:text-brand-red"
                      >
                        <FolderTree size={11} /> {c.name}
                      </Link>
                    ))}
                    {brandMatches.map((b) => (
                      <Link
                        key={b.id}
                        href={`/products?brand=${b.slug}`}
                        className="flex items-center gap-1 rounded-full border border-surface-border px-2.5 py-1 text-xs text-ink hover:border-brand-red hover:text-brand-red"
                      >
                        <Tags size={11} /> {b.name}
                      </Link>
                    ))}
                  </div>
                )}

                {suggestions.length > 0 && (
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
                              €{getEffectivePrice({ priceEur: p.priceEur, discountPriceEur: p.discountPriceEur ?? undefined } as any, user).finalPrice.toFixed(2)}
                            </span>
                          ) : (
                            <CallForQuote size="xs" />
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  onClick={() => submitSearch(query)}
                  className="flex w-full items-center justify-between border-t border-surface-border px-4 py-2.5 text-sm font-medium text-brand-red hover:bg-surface-muted"
                >
                  See all results for "{query}" <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-ink-soft">No quick matches for "{query}"</p>
                <button
                  type="button"
                  onClick={() => submitSearch(query)}
                  className="mt-2 text-xs font-semibold text-brand-red hover:underline"
                >
                  Search anyway
                </button>
              </div>
            )
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

              {popular.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    <TrendingUp size={12} /> Popular searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {popular.map((term) => (
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

              {recent.length === 0 && popular.length === 0 && (
                <p className="text-center text-xs text-ink-soft">Start typing to search parts…</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
