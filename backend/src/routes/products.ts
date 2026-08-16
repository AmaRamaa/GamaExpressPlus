import { Router } from "express";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../lib/prisma";
import { buildProductSearchAnd } from "../lib/search";
import { requireAuth, requireRole, AuthedRequest } from "../middleware/auth";

const router = Router();

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
            title: `[Draft] ${parsed.data.sku}`,
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
      const product = await prisma.product.create({
        data: {
          ...parsed.data,
          sku,
          slug,
          title: parsed.data.title?.trim() || `[Draft] ${sku}`,
          partNumber: parsed.data.partNumber?.trim() || sku,
          categoryId: parsed.data.categoryId || defaultCategoryId,
          brandId: parsed.data.brandId || defaultBrandId,
          priceEur: parsed.data.priceEur ?? 0,
        },
      });
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

  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data });
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req: AuthedRequest, res) => {
  await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.status(204).send();
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

// Admin-only and not free (a few thousand tokens per call on Claude Haiku
// 4.5 -- roughly half a cent), so it's opt-in per product rather than
// running automatically on upload.
router.post("/analyze-photos", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "AI photo analysis isn't configured yet (missing ANTHROPIC_API_KEY)." });
  }

  const parsed = analyzeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);

  const client = new Anthropic();

  try {
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
            ...parsed.data.imageUrls.map((url) => ({ type: "image" as const, source: { type: "url" as const, url } })),
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
    if (!textBlock) {
      return res.status(502).json({ error: "The AI didn't return a usable suggestion. Try again." });
    }

    const result = aiSuggestionSchema.safeParse(JSON.parse(textBlock.text));
    if (!result.success) {
      return res.status(502).json({ error: "The AI's response didn't match the expected format. Try again." });
    }
    res.json(result.data);
  } catch (err: any) {
    res.status(502).json({ error: err.message || "AI photo analysis failed." });
  }
});

export default router;
