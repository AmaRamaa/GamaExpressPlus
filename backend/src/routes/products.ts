import { Router } from "express";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../lib/prisma";
import { buildProductSearchAnd } from "../lib/search";
import { requireAuth, requireRole, AuthedRequest } from "../middleware/auth";

const router = Router();

// Title markers for products the AI tooling owns until a human takes over.
// "[Draft] " = staff-PIN fast entry, nothing filled in yet. "[AI] " = the
// draft auto-complete flow has filled it in and it's awaiting review. Either
// marker is stripped the moment an admin saves the product (see PUT /:id),
// which is also what tells the AI tools to leave it alone from then on.
export const DRAFT_PREFIX = "[Draft] ";
export const AI_PREFIX = "[AI] ";

// Whitelists exactly which fields an admin request can set — prevents mass
// assignment via extra/unexpected keys in the request body (e.g. someone
// tampering with fields Prisma would otherwise happily write straight from
// req.body, like costEur or relation ids outside the intended shape).
const productWriteSchema = z.object({
  sku: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  technicalInfo: z.string().optional(),
  installationNotes: z.string().optional(),
  categoryId: z.string().min(1).optional(),
  brandId: z.string().min(1).optional(),
  manufacturerId: z.string().nullable().optional(),
  oemNumbers: z.array(z.string()).optional().default([]),
  partNumber: z.string().min(1).optional(),
  manufacturerNumber: z.string().optional(),
  barcode: z.string().optional(),
  priceEur: z.number().min(0).optional(),
  discountPriceEur: z.number().min(0).optional(),
  costEur: z.number().min(0).optional(),
  vatRatePct: z.number().min(0).max(100).optional(),
  weightKg: z.number().min(0).optional(),
  dimensionsCm: z.string().optional(),
  stockStatus: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "BACKORDER", "DISCONTINUED"]).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isPerformancePart: z.boolean().optional(),
  locationCompany: z.string().min(1).optional(),
  images: z
    .object({
      create: z
        .array(
          z.object({
            url: z.string().min(1),
            originalUrl: z.string().optional(),
            altText: z.string().optional(),
            sortOrder: z.number().int().optional(),
          })
        )
        .optional(),
    })
    .optional(),
  compatibility: z
    .object({
      create: z
        .array(
          z.object({
            engineId: z.string().min(1),
            notes: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

// Staff-PIN fast entry: only SKU + photos are collected on the floor. Everything
// else that's normally required (title, slug, category, brand, part number,
// price) gets a sensible placeholder so a real admin can find and finish these
// in one pass afterward -- created inactive so an incomplete/zero-priced,
// unsorted product is never live on the storefront in the meantime.
const staffFastEntrySchema = z.object({
  sku: z.string().min(1),
  description: z.string().optional(),
  images: z
    .object({
      create: z
        .array(
          z.object({
            url: z.string().min(1),
            altText: z.string().optional(),
            sortOrder: z.number().int().optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";
}

// "Daily code" -- a running G-001, G-002, ... counter assigned to the
// Part Number field for products entered without a real one on hand. Not
// actually reset daily; a running counter avoids re-using a number (and
// therefore colliding on the unique-ish partNumber) if entry spans more
// than one day. Computed from the current max each time rather than a
// separate counter row, so it can't drift out of sync with real data.
async function getNextDailyCode() {
  const last = await prisma.product.findFirst({
    where: { partNumber: { startsWith: "G-" } },
    orderBy: { partNumber: "desc" },
    select: { partNumber: true },
  });
  const lastNum = last ? parseInt(last.partNumber.replace("G-", ""), 10) || 0 : 0;
  return `G-${String(lastNum + 1).padStart(3, "0")}`;
}

// Deliberately NOT cached across requests: if either row is ever deleted
// (e.g. someone doing catalog cleanup mistakes "Unknown" for stray junk),
// a cached id would keep pointing at a row that no longer exists and every
// fast-entry create would fail with a dangling foreign key until the process
// happened to restart. Re-upserting per request is cheap at this volume and
// makes the placeholders self-healing instead.
async function getPlaceholderCategoryAndBrand() {
  const [category, brand] = await Promise.all([
    prisma.category.upsert({
      where: { slug: "unsorted" },
      update: {},
      create: { name: "Unsorted (needs review)", slug: "unsorted" },
    }),
    prisma.brand.upsert({
      where: { name: "Unknown" },
      update: {},
      create: { name: "Unknown", slug: "unknown" },
    }),
  ]);
  return { categoryId: category.id, brandId: brand.id };
}

function withRatingSummary<T extends { reviews?: { rating: number }[] }>(product: T) {
  const { reviews, ...rest } = product;
  const reviewCount = reviews?.length ?? 0;
  const rating = reviewCount > 0 ? reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;
  return { ...rest, rating: Math.round(rating * 10) / 10, reviewCount };
}

// GET /api/products?category=&brand=&engineId=&minPrice=&maxPrice=&q=&sort=&page=&limit=
router.get("/", async (req, res) => {
  const {
    category, brand, engineId, generationId, modelId, makeId, minPrice, maxPrice, q, featured, ids,
    sort = "relevance", page = "1", limit = "24",
  } = req.query as Record<string, string>;

  const where: any = { isActive: true };
  if (category) where.category = { slug: category };
  if (brand) where.brand = { slug: brand };
  if (engineId) where.compatibility = { some: { engineId } };
  // Vehicle filters get progressively broader -- generationId is exact,
  // modelId/makeId let the Vehicle Finder search without the user having to
  // pin down a specific generation (or even model) first.
  if (generationId) where.compatibility = { some: { engine: { generationId } } };
  else if (modelId) where.compatibility = { some: { engine: { generation: { modelId } } } };
  else if (makeId) where.compatibility = { some: { engine: { generation: { model: { makeId } } } } };
  if (featured === "true") where.isFeatured = true;
  if (ids) where.id = { in: ids.split(",").filter(Boolean) };
  if (minPrice || maxPrice) {
    where.priceEur = {};
    if (minPrice) where.priceEur.gte = Number(minPrice);
    if (maxPrice) where.priceEur.lte = Number(maxPrice);
  }
  if (q) {
    const and = await buildProductSearchAnd(q);
    if (and) where.AND = and;
  }

  const orderBy: any =
    sort === "price_asc" ? { priceEur: "asc" } :
    sort === "price_desc" ? { priceEur: "desc" } :
    sort === "newest" ? { createdAt: "desc" } :
    { isFeatured: "desc" };

  const take = Math.min(Number(limit) || 24, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [rawItems, total] = await Promise.all([
    prisma.product.findMany({
      where, orderBy, take, skip,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        brand: true,
        category: true,
        manufacturer: true,
        reviews: { where: { status: "APPROVED" }, select: { rating: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const items = rawItems.map(withRatingSummary);

  res.json({ items, total, page: Number(page), limit: take, totalPages: Math.ceil(total / take) });
});

router.get("/:slug", async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      brand: true,
      category: true,
      manufacturer: true,
      compatibility: { include: { engine: { include: { generation: { include: { model: { include: { make: true } } } } } } } },
      reviews: { where: { status: "APPROVED" }, include: { user: { select: { firstName: true, lastName: true } } } },
      relatedTo: { include: { relatedProduct: { include: { images: { take: 1 } } } } },
    },
  });
  if (!product) return res.status(404).json({ error: "Product not found" });

  const reviewCount = product.reviews.length;
  const rating = reviewCount > 0 ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;

  res.json({ ...product, rating: Math.round(rating * 10) / 10, reviewCount });
});

// Admin (and staff-PIN device) create product
router.post("/", requireAuth, requireRole("ADMIN", "SUPER_ADMIN", "STAFF_PIN"), async (req: AuthedRequest, res) => {
  if (req.user?.role === "STAFF_PIN") {
    const parsed = staffFastEntrySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const staffName = req.body?.staffName;
    const createdByDevice = typeof staffName === "string" && staffName.trim() ? staffName.trim() : null;
    const { categoryId, brandId } = await getPlaceholderCategoryAndBrand();
    const baseSlug = slugify(parsed.data.sku);

    // Slug is unique -- extremely unlikely to collide since SKU already is,
    // but retry with a short suffix instead of failing the whole request.
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
      try {
        const partNumber = await getNextDailyCode();
        const product = await prisma.product.create({
          data: {
            sku: parsed.data.sku,
            slug,
            title: `${DRAFT_PREFIX}${parsed.data.sku}`,
            partNumber,
            description: parsed.data.description?.trim() || undefined,
            categoryId,
            brandId,
            priceEur: 0,
            isActive: false,
            createdByDevice,
            images: parsed.data.images,
          },
        });
        autoCompleteDraftProduct(product.id).catch((err) => console.error("Draft auto-complete failed:", err.message));
        return res.status(201).json(product);
      } catch (err: any) {
        if (err.code === "P2002" && err.meta?.target?.includes("slug")) continue;
        if (err.code === "P2002" && err.meta?.target?.includes("sku")) {
          return res.status(400).json({ error: `A product with SKU "${parsed.data.sku}" already exists.` });
        }
        return res.status(400).json({ error: err.message });
      }
    }
    return res.status(500).json({ error: "Could not generate a unique slug, try again." });
  }

  const parsed = productWriteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // Nothing is required anymore -- fill in anything left blank the same way
  // the staff fast-entry path does, so an admin can save a product with as
  // little or as much detail as they have on hand right now.
  const { categoryId: defaultCategoryId, brandId: defaultBrandId } = await getPlaceholderCategoryAndBrand();
  const sku = parsed.data.sku?.trim() || await getNextDailyCode();
  const baseSlug = slugify(parsed.data.slug || parsed.data.title || sku);

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    try {
      const isBlankDraft = !parsed.data.title?.trim();
      const product = await prisma.product.create({
        data: {
          ...parsed.data,
          sku,
          slug,
          title: parsed.data.title?.trim() || `${DRAFT_PREFIX}${sku}`,
          partNumber: parsed.data.partNumber?.trim() || sku,
          categoryId: parsed.data.categoryId || defaultCategoryId,
          brandId: parsed.data.brandId || defaultBrandId,
          priceEur: parsed.data.priceEur ?? 0,
          // Same invariant as staff-PIN fast entry: a still-unnamed draft is
          // never live on the storefront, even after the AI fills it in --
          // previously this only got set for the STAFF_PIN path above, so an
          // admin-created blank-title product (or one from an import row with
          // no title) could sit "live" with an unreviewed "[AI] " title.
          ...(isBlankDraft ? { isActive: false } : {}),
        },
      });
      if (product.title.startsWith(DRAFT_PREFIX)) {
        autoCompleteDraftProduct(product.id).catch((err) => console.error("Draft auto-complete failed:", err.message));
      } else {
        translateProductFields(product.id).catch((err) => console.error("Product translation failed:", err.message));
      }
      return res.status(201).json(product);
    } catch (err: any) {
      if (err.code === "P2002" && err.meta?.target?.includes("slug")) continue;
      if (err.code === "P2002" && err.meta?.target?.includes("sku")) {
        return res.status(400).json({ error: `A product with SKU "${sku}" already exists.` });
      }
      return res.status(400).json({ error: err.message });
    }
  }
  return res.status(500).json({ error: "Could not generate a unique slug, try again." });
});

router.put("/:id", requireAuth, requireRole("ADMIN", "SUPER_ADMIN", "STAFF_PIN"), async (req: AuthedRequest, res) => {
  const parsed = productWriteSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // The edit form always sends the complete current image/compatibility list
  // (not just what changed), so an edit should replace the stored set to
  // match rather than append to it -- otherwise removing a photo or a
  // vehicle-fitment entry in the UI would silently do nothing.
  const data: any = { ...parsed.data };
  if (parsed.data.images) {
    data.images = { deleteMany: {}, create: parsed.data.images.create ?? [] };
  }
  if (parsed.data.compatibility) {
    data.compatibility = { deleteMany: {}, create: parsed.data.compatibility.create ?? [] };
  }

  // Any save through this route means a human (or the fast-entry device) is
  // now handling this product -- strip a leftover "[Draft] "/"[AI] " marker
  // even if this particular save didn't touch the title, so neither the
  // draft auto-complete nor the translation/bulk tools ever touch it again.
  if (data.title === undefined) {
    const current = await prisma.product.findUnique({ where: { id: req.params.id }, select: { title: true } });
    if (current?.title.startsWith(DRAFT_PREFIX)) data.title = current.title.slice(DRAFT_PREFIX.length);
    else if (current?.title.startsWith(AI_PREFIX)) data.title = current.title.slice(AI_PREFIX.length);
  }

  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data });
    if (data.title !== undefined || parsed.data.shortDescription !== undefined || parsed.data.description !== undefined) {
      translateProductFields(product.id).catch((err) => console.error("Product translation failed:", err.message));
    }
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req: AuthedRequest, res) => {
  await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.status(204).send();
});

const translateSchema = z.object({
  detectedLanguage: z.enum(["SQ", "EN"]),
  titleTranslated: z.string(),
  shortDescriptionTranslated: z.string(),
  descriptionTranslated: z.string(),
});

// Detects whether a product's title/shortDescription/description are
// written in Albanian or English, then generates the counterpart in the
// other language so the storefront can show the right one for the
// visitor's chosen locale. Shared by the explicit POST /:id/translate route
// and the fire-and-forget hook after create/update -- callers that want a
// user-facing error should catch and report; the fire-and-forget hook just
// logs, matching how /analyze-photos degrades (never blocks core CRUD).
async function translateProductFields(productId: string) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("AI translation isn't configured yet (missing ANTHROPIC_API_KEY).");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { title: true, shortDescription: true, description: true },
  });
  if (!product) throw new Error("Product not found");
  // Draft/placeholder titles (e.g. "[Draft] G-042" from staff fast-entry)
  // aren't worth translating yet -- nothing to do until a real title exists.
  if (!product.title?.trim() || product.title.startsWith(DRAFT_PREFIX)) return null;

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1536,
    system:
      "You translate auto-parts catalog listings for a Kosovo store between Albanian (SQ) and English (EN). " +
      "First detect which of those two languages the given text is written in, then translate all fields into the OTHER language. " +
      "Keep SKUs, part numbers, OEM codes, and brand/manufacturer names unchanged. Keep the tone concise and factual, matching a parts-catalog listing. " +
      "If a field is empty, return an empty string for its translation.",
    messages: [
      {
        role: "user",
        content:
          `Title: ${product.title}\n` +
          `Short description: ${product.shortDescription || "(empty)"}\n` +
          `Description: ${product.description || "(empty)"}`,
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            detectedLanguage: { type: "string", enum: ["SQ", "EN"] },
            titleTranslated: { type: "string" },
            shortDescriptionTranslated: { type: "string" },
            descriptionTranslated: { type: "string" },
          },
          required: ["detectedLanguage", "titleTranslated", "shortDescriptionTranslated", "descriptionTranslated"],
          additionalProperties: false,
        },
      },
    },
  });

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) throw new Error("The AI didn't return a usable translation.");

  const result = translateSchema.safeParse(JSON.parse(textBlock.text));
  if (!result.success) throw new Error("The AI's response didn't match the expected format.");

  return prisma.product.update({
    where: { id: productId },
    data: {
      contentLanguage: result.data.detectedLanguage,
      titleTranslated: result.data.titleTranslated || null,
      shortDescriptionTranslated: result.data.shortDescriptionTranslated || null,
      descriptionTranslated: result.data.descriptionTranslated || null,
    },
  });
}

router.post("/:id/translate", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  try {
    const updated = await translateProductFields(req.params.id);
    if (!updated) return res.json({ skipped: true, reason: "Product has no real title yet." });
    res.json(updated);
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Translation failed." });
  }
});

const analyzeSchema = z.object({
  imageUrls: z.array(z.string().min(1)).min(1).max(4),
});

// What the model gives back per photo set. Vehicle compatibility is
// deliberately free-text + a confidence flag rather than a resolved
// make/model/generation id -- a photo alone usually can't pin that down
// precisely, so the frontend shows it as a hint next to the manual picker
// instead of an auto-applied value like the other fields.
const aiSuggestionSchema = z.object({
  title: z.string(),
  brand: z.string(),
  category: z.string(),
  shortDescription: z.string(),
  vehicleCompatibilityGuess: z.string(),
  vehicleConfidence: z.enum(["low", "medium", "high"]),
});

// Shared by the manual "Analyze photos" button (/analyze-photos below) and
// the automatic draft-completion flow (autoCompleteDraftProduct) -- same
// prompt/model/schema either way, just different callers decide whether to
// show the suggestion for confirmation or auto-apply it.
async function analyzeProductPhotos(imageUrls: string[]) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("AI photo analysis isn't configured yet (missing ANTHROPIC_API_KEY).");
  }

  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system:
      "You are helping a Kosovo auto-parts store catalog photos of exterior car parts (bumpers, lights, mirrors, glass, trim, body panels). " +
      "Look at the photo(s) of a single part and suggest catalog fields. " +
      "For brand, prefer one of the store's existing brand names if the part's brand is visibly identifiable (a logo, an OEM label); otherwise say \"Unknown\". " +
      "For category, pick the closest match from the store's existing category names. " +
      "For vehicleCompatibilityGuess, only guess a specific make/model/years if there's a real visual clue (a badge, a distinctive shape you recognize, visible OEM/part numbers) -- otherwise say \"Not enough visual information to determine compatibility.\" and set vehicleConfidence to \"low\". Never invent a specific vehicle with no supporting evidence.",
    messages: [
      {
        role: "user",
        content: [
          ...imageUrls.map((url) => ({ type: "image" as const, source: { type: "url" as const, url } })),
          {
            type: "text" as const,
            text:
              `Existing brands: ${brands.map((b) => b.name).join(", ") || "(none yet)"}\n` +
              `Existing categories: ${categories.map((c) => c.name).join(", ") || "(none yet)"}\n\n` +
              "Suggest catalog fields for this part.",
          },
        ],
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            brand: { type: "string" },
            category: { type: "string" },
            shortDescription: { type: "string" },
            vehicleCompatibilityGuess: { type: "string" },
            vehicleConfidence: { type: "string", enum: ["low", "medium", "high"] },
          },
          required: ["title", "brand", "category", "shortDescription", "vehicleCompatibilityGuess", "vehicleConfidence"],
          additionalProperties: false,
        },
      },
    },
  });

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) throw new Error("The AI didn't return a usable suggestion. Try again.");

  const result = aiSuggestionSchema.safeParse(JSON.parse(textBlock.text));
  if (!result.success) throw new Error("The AI's response didn't match the expected format. Try again.");
  return result.data;
}

// Admin-only and not free (a few thousand tokens per call on Claude Haiku
// 4.5 -- roughly half a cent), so it's opt-in per product rather than
// running automatically on upload.
router.post("/analyze-photos", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  const parsed = analyzeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    res.json(await analyzeProductPhotos(parsed.data.imageUrls));
  } catch (err: any) {
    res.status(502).json({ error: err.message || "AI photo analysis failed." });
  }
});

// Auto-completes a still-unfinished staff-PIN draft (title starting with
// "[Draft] ") using the same photo analysis as the manual "Analyze photos"
// button, applying its top suggestion directly rather than waiting for an
// admin to click "Use this" per field -- per the house rule that AI never
// overwrites anything an admin has already touched, this ONLY ever acts on
// products still carrying the untouched "[Draft] " marker (any admin save,
// even one that doesn't change the title, strips that marker -- see PUT
// /:id below), and marks its own output with "[AI] " instead of leaving it
// looking like an admin-authored title, so it's obvious at a glance that it
// still wants a human review.
async function autoCompleteDraftProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 4 } },
  });
  if (!product || !product.title.startsWith(DRAFT_PREFIX)) return null;
  if (product.images.length === 0) return null; // nothing to analyze yet

  const suggestion = await analyzeProductPhotos(product.images.map((img) => img.url));

  const [matchedBrand, matchedCategory] = await Promise.all([
    prisma.brand.findFirst({ where: { name: { equals: suggestion.brand, mode: "insensitive" } } }),
    prisma.category.findFirst({ where: { name: { equals: suggestion.category, mode: "insensitive" } } }),
  ]);

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      title: AI_PREFIX + suggestion.title,
      shortDescription: suggestion.shortDescription,
      // Only reassign brand/category when the AI's suggestion resolves to an
      // existing catalog entry -- never silently create a new one, matching
      // the manual "Use this" button being disabled for unmatched names.
      ...(matchedBrand ? { brandId: matchedBrand.id } : {}),
      ...(matchedCategory ? { categoryId: matchedCategory.id } : {}),
      // A bare "[Draft] " placeholder has nothing worth showing (literally
      // just a SKU) and stays inactive, but once the AI has filled in a real
      // title/description it's fine to be live -- the storefront shows an
      // "AI-suggested" marker on it rather than hiding it until a human
      // gets to it, which could otherwise sit invisible indefinitely.
      isActive: true,
    },
  });
  // Now that there's a real title/description, it's worth translating too.
  translateProductFields(productId).catch((err) => console.error("Product translation failed:", err.message));
  return updated;
}

router.post("/:id/auto-complete", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  try {
    const updated = await autoCompleteDraftProduct(req.params.id);
    if (!updated) return res.json({ skipped: true, reason: "Not a pending draft (already handled, or has no photos yet)." });
    res.json(updated);
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Auto-complete failed." });
  }
});

export default router;
