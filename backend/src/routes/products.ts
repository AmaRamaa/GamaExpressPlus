import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, AuthedRequest } from "../middleware/auth";

const router = Router();

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

// Admin: create product
router.post("/", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req: AuthedRequest, res) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req: AuthedRequest, res) => {
  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
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
