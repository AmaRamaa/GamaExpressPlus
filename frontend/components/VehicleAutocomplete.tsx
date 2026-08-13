"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Fuse from "fuse.js";
import { Search } from "lucide-react";
import { api } from "@/lib/api";

export interface VehicleSearchEntry {
  makeId: string;
  makeName: string;
  modelId: string;
  modelName: string;
  generationId: string;
  generationName: string;
  yearFrom: number;
  yearTo: number | null;
  bodyType: string | null;
}

// Module-level cache: the full vehicle tree rarely changes and is small
// enough to fetch once and fuzzy-search entirely in the browser, so every
// autocomplete instance on the page (and across navigations) shares one copy
// instead of re-fetching per mount.
let cachedEntries: VehicleSearchEntry[] | null = null;
let cachedPromise: Promise<VehicleSearchEntry[]> | null = null;

function loadIndex(): Promise<VehicleSearchEntry[]> {
  if (cachedEntries) return Promise.resolve(cachedEntries);
  if (!cachedPromise) {
    cachedPromise = api.get<VehicleSearchEntry[]>("/vehicles/search-index").then((data) => {
      cachedEntries = data;
      return data;
    });
  }
  return cachedPromise;
}

export default function VehicleAutocomplete({
  placeholder = "Type your car, e.g. Golf 7",
  onSelect,
  className = "",
  inputClassName = "",
}: {
  placeholder?: string;
  onSelect: (entry: VehicleSearchEntry) => void;
  className?: string;
  inputClassName?: string;
}) {
  const [query, setQuery] = useState("");
  const [fuse, setFuse] = useState<Fuse<VehicleSearchEntry> | null>(null);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadIndex()
      .then((data) => {
        setFuse(
          new Fuse(data, {
            keys: [
              { name: "makeName", weight: 0.35 },
              { name: "modelName", weight: 0.4 },
              { name: "generationName", weight: 0.25 },
            ],
            threshold: 0.35, // forgiving of typos, but not so loose it matches everything
            ignoreLocation: true,
            minMatchCharLength: 2,
          })
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const results = query.trim().length >= 2 && fuse ? fuse.search(query.trim(), { limit: 8 }).map((r) => r.item) : [];

  function pick(entry: VehicleSearchEntry) {
    onSelect(entry);
    setQuery(`${entry.makeName} ${entry.modelName} ${entry.generationName}`);
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          className={`w-full rounded-lg border border-surface-border bg-surface py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-brand-red ${inputClassName}`}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlighted(0);
          }}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>
      {open && results.length > 0 && (
        <ul className="absolute left-0 top-full z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-surface-border bg-surface p-1 shadow-lifted">
          {results.map((r, i) => (
            <li key={r.generationId}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(r)}
                className={`flex w-full flex-col items-start rounded-md px-2.5 py-2 text-left text-sm ${
                  i === highlighted ? "bg-brand-red-light text-brand-red" : "text-ink hover:bg-surface-muted"
                }`}
              >
                <span className="font-medium">{r.makeName} {r.modelName}</span>
                <span className="text-xs text-ink-soft">{r.generationName} · {r.yearFrom}–{r.yearTo ?? "present"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
