import { prisma } from "./prisma";

// Splits a free-text query into words and requires every word to match
// SOMEWHERE across the searchable fields (title, description, part/SKU
// numbers, brand, category, OEM numbers) -- not the whole phrase verbatim
// in one field. Real part titles are long structured strings like
// "MBROJTESI I PARE ME LARJE - VW GOLF VII 2013-2016 (5G1)", so a plain
// substring match on the full query missed almost every multi-word search
// (e.g. "golf 7 bumper").
export async function buildProductSearchAnd(q: string) {
  const tokens = q.trim().split(/\s+/).filter(Boolean).slice(0, 8);
  if (tokens.length === 0) return null;

  // oemNumbers is a Postgres text[] column -- Prisma's list filters only
  // support exact-element matches (`has`), not substring, so a raw query
  // finds products with an OEM code that merely *contains* the token
  // (customers often only remember part of the code, not the full string).
  const oemMatchesByToken = await Promise.all(
    tokens.map((t) =>
      prisma.$queryRaw<{ id: string }[]>`
        SELECT DISTINCT p.id FROM "Product" p, unnest(p."oemNumbers") AS oem
        WHERE oem ILIKE ${"%" + t + "%"}
      `
    )
  );

  return tokens.map((t, i) => ({
    OR: [
      { title: { contains: t, mode: "insensitive" as const } },
      { shortDescription: { contains: t, mode: "insensitive" as const } },
      { description: { contains: t, mode: "insensitive" as const } },
      { partNumber: { contains: t, mode: "insensitive" as const } },
      { manufacturerNumber: { contains: t, mode: "insensitive" as const } },
      { sku: { contains: t, mode: "insensitive" as const } },
      { brand: { name: { contains: t, mode: "insensitive" as const } } },
      { category: { name: { contains: t, mode: "insensitive" as const } } },
      ...(oemMatchesByToken[i].length ? [{ id: { in: oemMatchesByToken[i].map((r) => r.id) } }] : []),
    ],
  }));
}
