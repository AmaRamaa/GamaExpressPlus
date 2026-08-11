import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, AuthedRequest } from "../middleware/auth";

const router = Router();

// Whitelists exactly which fields an admin request can set — prevents mass
// assignment via extra/unexpected keys in the request body (e.g. someone
// tampering with fields Prisma would otherwise happily write straight from
// req.body, like costEur or relation ids outside the intended shape).
const productWriteSchema = z.object({
  sku: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  technicalInfo: z.string().optional(),
  installationNotes: z.string().optional(),
  categoryId: z.string().min(1),
  brandId: z.string().min(1),
  oemNumbers: z.array(z.string()).optional().default([]),
  partNumber: z.string().min(1),
  manufacturerNumber: z.string().optional(),
  barcode: z.string().optional(),
  priceEur: z.number().min(0),
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
            altText: z.string().optional(),
            sortOrder: z.number().int().optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

function withRatingSummary<T extends { reviews?: { rating: number }[] }>(product: T) {
  const { reviews, ...rest } = product;
  const reviewCount = reviews?.length ?? 0;
  const rating = reviewCount > 0 ? reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;
  return { ...rest, rating: Math.round(rating * 10) / 10, reviewCount };
}

// GET /api/products?category=&brand=&engineId=&minPrice=&maxPrice=&q=&sort=&page=&limit=
router.get("/", async (req, res) => {
  const {
    category, brand, engineId, generationId, minPrice, maxPrice, q, featured, ids,
    sort = "relevance", page = "1", limit = "24",
  } = req.query as Record<string, string>;

  const where: any = { isActive: true };
  if (category) where.category = { slug: category };
  if (brand) where.brand = { slug: brand };
  if (engineId) where.compatibility = { some: { engineId } };
  if (generationId) where.compatibility = { some: { engine: { generationId } } };
  if (featured === "true") where.isFeatured = true;
  if (ids) where.id = { in: ids.split(",").filter(Boolean) };
  if (minPrice || maxPrice) {
    where.priceEur = {};
    if (minPrice) where.priceEur.gte = Number(minPrice);
    if (maxPrice) where.priceEur.lte = Number(maxPrice);
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { partNumber: { contains: q, mode: "insensitive" } },
      { manufacturerNumber: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { oemNumbers: { has: q } },
    ];
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
  const parsed = productWriteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // staffName is intentionally read straight off req.body rather than being
  // part of productWriteSchema -- it isn't a real product field, it just
  // tags which shared device/staff member created the product when the
  // request came in via the staff-PIN flow. Real admin logins never set it.
  const data: typeof parsed.data & { createdByDevice?: string | null } = { ...parsed.data };
  if (req.user?.role === "STAFF_PIN") {
    const staffName = req.body?.staffName;
    data.createdByDevice = typeof staffName === "string" && staffName.trim() ? staffName.trim() : null;
  }

  try {
    const product = await prisma.product.create({ data });
    res.status(201).json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", requireAuth, requireRole("ADMIN", "SUPER_ADMIN", "STAFF_PIN"), async (req: AuthedRequest, res) => {
  const parsed = productWriteSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req: AuthedRequest, res) => {
  await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.status(204).send();
});

export default router;
