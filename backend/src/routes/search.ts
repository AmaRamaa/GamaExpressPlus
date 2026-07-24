import { Router } from "express";
import { prisma } from "../lib/prisma";
import { optionalAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

// GET /api/search/suggest?q=brake+pad
router.get("/suggest", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (q.length < 2) return res.json({ products: [], categories: [], brands: [] });

  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { partNumber: { contains: q, mode: "insensitive" } },
          { oemNumbers: { has: q } },
          { sku: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
      select: { id: true, title: true, slug: true, priceEur: true, discountPriceEur: true, partNumber: true, images: { take: 1 } },
    }),
    prisma.category.findMany({ where: { name: { contains: q, mode: "insensitive" } }, take: 4 }),
    prisma.brand.findMany({ where: { name: { contains: q, mode: "insensitive" } }, take: 4 }),
  ]);

  res.json({ products, categories, brands });
});

router.post("/track", optionalAuth, async (req: AuthedRequest, res) => {
  const { query } = req.body ?? {};
  if (!query) return res.status(400).json({ error: "Missing query" });
  await prisma.searchHistory.create({ data: { query, userId: req.user?.userId } });
  res.status(201).json({ ok: true });
});

router.get("/recent", optionalAuth, async (req: AuthedRequest, res) => {
  if (!req.user) return res.json([]);
  const recent = await prisma.searchHistory.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    distinct: ["query"],
  });
  res.json(recent.map((r) => r.query));
});

router.get("/popular", async (_req, res) => {
  const rows = await prisma.searchHistory.groupBy({
    by: ["query"],
    _count: { query: true },
    orderBy: { _count: { query: "desc" } },
    take: 10,
  });
  res.json(rows.map((r) => r.query));
});

export default router;
