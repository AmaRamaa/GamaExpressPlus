"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleGauge, ChevronDown } from "lucide-react";
import { vehicleMakes } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import type { VehicleGeneration, VehicleMake } from "@/lib/types";

function MakeBadge({ make, size = 20 }: { make: VehicleMake; size?: number }) {
  if (make.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={make.logoUrl} alt="" className="shrink-0 rounded-full object-contain" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-white"
      style={{ width: size, height: size, background: make.color || "#4B5563", fontSize: size * 0.5 }}
    >
      {make.name.charAt(0)}
    </span>
  );
}

export default function VehicleFinder({ variant: variantProp = "card" }: { variant?: "card" | "inline" }) {
  const router = useRouter();
  const setVehicle = useStore((s) => s.setVehicle);

  const [makeId, setMakeId] = useState("");
  const [modelId, setModelId] = useState("");
  const [pickerValue, setPickerValue] = useState("");
  const [yearInput, setYearInput] = useState("");
  const [makeMenuOpen, setMakeMenuOpen] = useState(false);
  const makeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (makeMenuRef.current && !makeMenuRef.current.contains(e.target as Node)) {
        setMakeMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const make = vehicleMakes.find((m) => m.id === makeId);
  const model = make?.models.find((m) => m.id === modelId);

  function selectMake(id: string) {
    setMakeId(id);
    setModelId(""); setPickerValue(""); setYearInput("");
    setMakeMenuOpen(false);
  }

  const distinctBodyTypes = useMemo(() => {
    if (!model) return [];
    return Array.from(new Set(model.generations.map((g) => g.bodyType).filter((b): b is string => !!b)));
  }, [model]);

  // A picker only helps if it actually disambiguates something. If the model
  // comes in more than one body style (e.g. A3 Sportsback vs Sedan), let the
  // user pick that. Otherwise, if the model simply has multiple generations
  // (e.g. Golf Mk6 vs Mk7 — both hatchbacks), let them pick the generation
  // directly, since year ranges between generations can overlap.
  const pickerMode: "bodyStyle" | "generation" | "none" = useMemo(() => {
    if (!model) return "none";
    if (distinctBodyTypes.length > 1) return "bodyStyle";
    if (model.generations.length > 1) return "generation";
    return "none";
  }, [model, distinctBodyTypes]);

  const pickerLabel = pickerMode === "bodyStyle" ? "Variant" : "Series";

  const candidateGenerations: VehicleGeneration[] = useMemo(() => {
    if (!model) return [];
    if (pickerMode === "bodyStyle") {
      return pickerValue ? model.generations.filter((g) => g.bodyType === pickerValue) : model.generations;
    }
    if (pickerMode === "generation") {
      return pickerValue ? model.generations.filter((g) => g.id === pickerValue) : model.generations;
    }
    return model.generations;
  }, [model, pickerMode, pickerValue]);

  const sortedCandidates = useMemo(
    () => [...candidateGenerations].sort((a, b) => a.yearFrom - b.yearFrom),
    [candidateGenerations]
  );

  const year = yearInput.trim() ? Number(yearInput) : null;
  const validYear = year !== null && Number.isInteger(year) && yearInput.trim().length === 4;

  const yearMatches = useMemo(() => {
    if (!validYear || year === null) return [];
    return sortedCandidates.filter((g) => year >= g.yearFrom && year <= (g.yearTo ?? new Date().getFullYear() + 1));
  }, [sortedCandidates, validYear, year]);

  const matchedGeneration = yearMatches.length === 1 ? yearMatches[0] : null;

  const yearRangeHint = useMemo(() => {
    if (sortedCandidates.length === 0) return null;
    return sortedCandidates.map((g) => `${g.yearFrom}–${g.yearTo ?? "present"}`).join(", ");
  }, [sortedCandidates]);

  const yearError = (() => {
    if (!model || !validYear) return null;
    if (yearMatches.length === 0) {
      return `That year isn't covered for this ${pickerValue || "model"}. Produced: ${yearRangeHint}.`;
    }
    if (yearMatches.length > 1) {
      return `Multiple ${model.name} generations match ${year} — select the ${pickerLabel.toLowerCase()} above to narrow it down.`;
    }
    return null;
  })();

  const canSearch = !!matchedGeneration;

  function handleSearch() {
    if (!make || !model || !matchedGeneration || year === null) return;
    setVehicle({
      makeId: make.id, makeName: make.name,
      modelId: model.id, modelName: model.name,
      generationId: matchedGeneration.id, generationName: matchedGeneration.name,
      variant: matchedGeneration.bodyType,
      year,
    });
    router.push(`/products?generationId=${matchedGeneration.id}`);
  }

  const selectClass =
    "w-full rounded-lg border border-surface-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-red disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-soft/60";

  return (
    <div className={variantProp === "card" ? "w-full rounded-xl border border-surface-border bg-surface p-5 shadow-lifted" : "w-full"}>
      {variantProp === "card" && (
        <div className="mb-4 flex items-center gap-2">
          <CircleGauge size={18} className="text-brand-red" />
          <h3 className="font-display text-lg font-semibold text-ink">Find parts for your vehicle</h3>
        </div>
      )}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
        <div className="relative" ref={makeMenuRef}>
          <button
            type="button"
            onClick={() => setMakeMenuOpen((v) => !v)}
            className={`${selectClass} flex items-center justify-between gap-2 text-left`}
          >
            <span className="flex min-w-0 items-center gap-2">
              {make && <MakeBadge make={make} size={18} />}
              <span className={`truncate ${make ? "text-ink" : "text-ink-soft"}`}>{make ? make.name : "Manufacturer"}</span>
            </span>
            <ChevronDown size={14} className={`shrink-0 text-ink-soft transition-transform ${makeMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {makeMenuOpen && (
            <ul
              role="listbox"
              className="absolute left-0 top-full z-30 mt-1 max-h-64 w-full min-w-[190px] overflow-y-auto rounded-lg border border-surface-border bg-surface p-1 shadow-lifted"
            >
              {vehicleMakes.map((m) => (
                <li key={m.id} role="option" aria-selected={m.id === makeId}>
                  <button
                    type="button"
                    onClick={() => selectMake(m.id)}
                    className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm ${
                      m.id === makeId ? "bg-brand-red-light text-brand-red" : "text-ink hover:bg-surface-muted"
                    }`}
                  >
                    <MakeBadge make={m} />
                    {m.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <select
          className={selectClass}
          value={modelId}
          disabled={!makeId}
          onChange={(e) => {
            setModelId(e.target.value);
            setPickerValue(""); setYearInput("");
          }}
        >
          <option value="">Model</option>
          {make?.models.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        {pickerMode !== "none" && (
          <select
            className={selectClass}
            value={pickerValue}
            disabled={!modelId}
            onChange={(e) => setPickerValue(e.target.value)}
          >
            <option value="">{pickerLabel}</option>
            {pickerMode === "bodyStyle"
              ? distinctBodyTypes.map((b) => <option key={b} value={b}>{b}</option>)
              : model?.generations.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        )}

        <input
          type="number"
          inputMode="numeric"
          placeholder="Car year"
          className={selectClass}
          value={yearInput}
          disabled={!modelId}
          onChange={(e) => setYearInput(e.target.value)}
        />
      </div>

      {yearError && <p className="mt-2 text-xs text-brand-red">{yearError}</p>}
      {!yearError && yearRangeHint && !yearInput && (
        <p className="mt-2 text-xs text-ink-soft">
          {pickerMode !== "none" && !pickerValue && `${pickerLabel} is optional. `}Produced: {yearRangeHint}
        </p>
      )}

      <button
        onClick={handleSearch}
        disabled={!canSearch}
        className="mt-4 w-full rounded-lg bg-brand-red py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:bg-surface-border disabled:text-ink-soft"
      >
        Show compatible parts
      </button>
    </div>
  );
}
