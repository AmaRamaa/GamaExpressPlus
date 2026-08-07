"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface EntityOption {
  id: string;
  name: string;
}

export function EntityCombobox({
  value,
  onChange,
  options,
  placeholder = "Select…",
  onCreate,
  disabled,
  className,
}: {
  value: string;
  onChange: (id: string) => void;
  options: EntityOption[];
  placeholder?: string;
  onCreate?: (name: string) => Promise<EntityOption>;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [localExtra, setLocalExtra] = useState<EntityOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const allOptions = useMemo(() => {
    const map = new Map<string, EntityOption>();
    [...options, ...localExtra].forEach((o) => map.set(o.id, o));
    return Array.from(map.values());
  }, [options, localExtra]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter((o) => o.name.toLowerCase().includes(q));
  }, [allOptions, query]);

  const selected = allOptions.find((o) => o.id === value);
  const exactMatch = allOptions.some((o) => o.name.trim().toLowerCase() === query.trim().toLowerCase());

  async function handleCreate() {
    if (!onCreate || !query.trim()) return;
    setCreating(true);
    setError("");
    try {
      const created = await onCreate(query.trim());
      setLocalExtra((prev) => [...prev, created]);
      onChange(created.id);
      setOpen(false);
      setQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setQuery(""); setError(""); } }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-red disabled:cursor-not-allowed disabled:opacity-60",
            !selected && "text-slate-400",
            className
          )}
        >
          <span className="truncate">{selected?.name || placeholder}</span>
          <ChevronsUpDown size={14} className="shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="mb-2 h-8"
        />
        {error && <p className="mb-1 px-1 text-xs text-red-600">{error}</p>}
        <div className="max-h-48 space-y-0.5 overflow-y-auto">
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                onChange(o.id);
                setOpen(false);
                setQuery("");
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-ink hover:bg-slate-100"
            >
              <Check size={14} className={cn("shrink-0", o.id === value ? "opacity-100 text-brand-red" : "opacity-0")} />
              <span className="truncate">{o.name}</span>
            </button>
          ))}
          {filtered.length === 0 && !onCreate && (
            <p className="px-2 py-1.5 text-sm text-ink-soft">No results.</p>
          )}
        </div>
        {onCreate && query.trim() && !exactMatch && (
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="mt-1 flex w-full items-center gap-2 rounded-md border-t border-slate-100 px-2 py-1.5 pt-2 text-left text-sm font-medium text-brand-red hover:bg-brand-red-light disabled:opacity-60"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create &quot;{query.trim()}&quot;
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
