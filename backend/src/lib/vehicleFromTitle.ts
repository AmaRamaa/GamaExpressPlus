// Works out which vehicle a product title is about ("MBROJTESI I PARE -
// SKODA SCALA 2023-") by matching it against the existing vehicle catalog.
//
// Deliberately strict: a wrong fitment (customer buys a bumper that doesn't
// fit) is worse than none, so anything ambiguous returns null and the product
// is simply left without automatic fitment. Pure -- no database access -- so
// it can be tested against the live catalog and real titles.

export interface CatalogGeneration {
  generationId: string;
  generationName: string;
  yearFrom: number;
  yearTo: number | null;
  modelId: string;
  modelName: string;
  makeId: string;
  makeName: string;
}

export interface VehicleMatch {
  makeId: string;
  makeName: string;
  modelId: string;
  modelName: string;
  generationIds: string[];
  yearFrom: number;
  yearTo: number | null;
}

// Catalog rows that exist only to park retired data -- never match into them.
const IGNORED_MAKES = new Set(["OLD DON'T USE"]);

// Title spellings that differ from the catalog's make names.
const MAKE_ALIASES: Record<string, string> = {
  VOLKSWAGEN: "VW",
  "MERCEDES BENZ": "MERCEDES",
};

function tokenize(s: string): string[] {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
}

// Pulls the year range out of a title: "2016-2021", "13-16", "2023-" (still
// in production), "20-" or a lone "2016". Returns null when there isn't one.
export function parseYearRange(title: string, currentYear: number): { from: number; to: number | null } | null {
  const t = title.replace(/[–—]/g, "-");
  const fullYear = (n: string) => Number(n);
  const shortYear = (n: string) => {
    const v = Number(n);
    return v <= 40 ? 2000 + v : 1900 + v;
  };

  let m = t.match(/(?<!\d)((?:19|20)\d{2})\s*-\s*((?:19|20)\d{2})?(?!\d)/);
  if (m) {
    const from = fullYear(m[1]);
    const to = m[2] ? fullYear(m[2]) : null;
    if (to !== null && to < from) return null;
    return { from, to };
  }

  m = t.match(/(?<![\d.])(\d{2})\s*-\s*(\d{2})?(?![\d.])/);
  if (m) {
    const from = shortYear(m[1]);
    const to = m[2] ? shortYear(m[2]) : null;
    if (from > currentYear + 1) return null;
    if (to !== null && to < from) return null;
    return { from, to };
  }

  m = t.match(/(?<!\d)((?:19|20)\d{2})(?!\d)/);
  if (m) return { from: fullYear(m[1]), to: fullYear(m[1]) };

  return null;
}

// Catalog generations often leave yearTo empty even after the next generation
// has started (e.g. Octavia "6 (2017-)" while "7 (2020-)" exists). Treat an
// open generation as ending where the next one of the same model begins.
function effectiveEnd(g: CatalogGeneration, siblings: CatalogGeneration[], currentYear: number): number {
  const nextStart = siblings
    .filter((s) => s.yearFrom > g.yearFrom)
    .reduce<number | null>((min, s) => (min === null || s.yearFrom < min ? s.yearFrom : min), null);
  if (g.yearTo !== null) return g.yearTo;
  return nextStart !== null ? nextStart : Math.max(currentYear, g.yearFrom);
}

export function parseVehicleFromTitle(
  title: string,
  catalog: CatalogGeneration[],
  currentYear = new Date().getFullYear()
): VehicleMatch | null {
  const titleTokens = tokenize(title);
  if (titleTokens.length === 0) return null;

  const years = parseYearRange(title, currentYear);
  if (!years) return null;

  // Group the catalog: make -> model -> generations.
  interface MakeEntry {
    id: string;
    name: string;
    models: Map<string, CatalogGeneration[]>;
  }
  const makes = new Map<string, MakeEntry>();
  for (const g of catalog) {
    if (IGNORED_MAKES.has(g.makeName.toUpperCase())) continue;
    let make = makes.get(g.makeId);
    if (!make) makes.set(g.makeId, (make = { id: g.makeId, name: g.makeName, models: new Map() }));
    const list = make.models.get(g.modelId) ?? [];
    list.push(g);
    make.models.set(g.modelId, list);
  }

  // 1) Find the make: the longest make name that appears as a run of tokens.
  const aliasTokens = Object.entries(MAKE_ALIASES).map(([alias, target]) => ({ tokens: tokenize(alias), target }));
  let best: { make: MakeEntry; end: number; len: number } | null = null;
  let ambiguousMake = false;
  for (const make of makes.values()) {
    const names = [tokenize(make.name), ...aliasTokens.filter((a) => a.target === make.name).map((a) => a.tokens)];
    for (const name of names) {
      if (name.length === 0) continue;
      for (let i = 0; i + name.length <= titleTokens.length; i++) {
        if (name.every((tok, k) => titleTokens[i + k] === tok)) {
          const candidate = { make, end: i + name.length, len: name.length };
          if (!best || candidate.len > best.len) {
            best = candidate;
            ambiguousMake = false;
          } else if (candidate.len === best.len && candidate.make.id !== best.make.id) {
            ambiguousMake = true;
          }
        }
      }
    }
  }
  if (!best || ambiguousMake) return null;

  // 2) The model must come right after the make ("SKODA SCALA ..."), as the
  // longest model name that prefixes the remaining words. Anchoring to the
  // make keeps short model names ("3", "5", "Y") from matching stray words
  // like the "5" in "5 DYRSH".
  let rest = titleTokens.slice(best.end);
  // "BMW 3 F30" is how titles usually write "BMW SERIES 3".
  if (best.make.name.toUpperCase() === "BMW" && /^[1-8]$/.test(rest[0] ?? "")) rest = ["SERIES", ...rest];
  let bestModel: { modelId: string; len: number; name: string }[] = [];
  let bestLen = 0;
  for (const [modelId, gens] of best.make.models) {
    const nameTokens = tokenize(gens[0].modelName);
    if (nameTokens.length === 0 || nameTokens.length > rest.length) continue;
    if (!nameTokens.every((tok, k) => rest[k] === tok)) continue;
    if (nameTokens.length > bestLen) {
      bestLen = nameTokens.length;
      bestModel = [{ modelId, len: nameTokens.length, name: gens[0].modelName }];
    } else if (nameTokens.length === bestLen) {
      bestModel.push({ modelId, len: nameTokens.length, name: gens[0].modelName });
    }
  }
  // Two different models with the same words (data duplicates): pool them.
  if (bestModel.length === 0) return null;
  const distinctNames = new Set(bestModel.map((m) => tokenize(m.name).join(" ")));
  if (distinctNames.size > 1) return null;

  const candidateGens = bestModel.flatMap((m) => best!.make.models.get(m.modelId) ?? []);

  // 3) Generations whose years cover at least half of the title's range.
  const yearFrom = years.from;
  const yearTo = years.to ?? Math.max(currentYear, years.from);
  const rangeLen = yearTo - yearFrom + 1;
  const endOf = (g: CatalogGeneration) =>
    effectiveEnd(g, candidateGens.filter((s) => s.modelId === g.modelId), currentYear);
  let picked = candidateGens.filter((g) => {
    const overlap = Math.min(endOf(g), yearTo) - Math.max(g.yearFrom, yearFrom) + 1;
    return overlap >= 1 && overlap / rangeLen >= 0.5;
  });
  if (years.to === null) {
    // "2015-" means "from 2015": the generation on sale then, not every later
    // one as well (the same year can sit on a boundary -- take the newer one).
    const onSale = candidateGens.filter((g) => g.yearFrom <= yearFrom && yearFrom <= endOf(g));
    const newestStart = Math.max(...onSale.map((g) => g.yearFrom));
    picked = onSale.filter((g) => g.yearFrom === newestStart);
  }
  if (picked.length === 0) return null;

  // Parallel variants of the same years (body types like Sedan vs Hatchback,
  // chassis codes like G30 vs F90): keep the ones the title actually names.
  // Year numbers don't count. If the title names none of them, keep all.
  const titleSet = new Set(titleTokens);
  const nameScore = (g: CatalogGeneration) =>
    tokenize(g.generationName).filter((tok) => !/^(?:19|20)\d{2}$/.test(tok) && titleSet.has(tok)).length;
  const topScore = Math.max(...picked.map(nameScore));
  const narrowed = topScore > 0 ? picked.filter((g) => nameScore(g) === topScore) : picked;
  // A single year that sits on a generation boundary is ambiguous.
  if (rangeLen === 1 && narrowed.length > 1) return null;

  return {
    makeId: best.make.id,
    makeName: best.make.name,
    modelId: narrowed[0].modelId,
    modelName: narrowed[0].modelName,
    generationIds: narrowed.map((g) => g.generationId),
    yearFrom: years.from,
    yearTo: years.to,
  };
}
