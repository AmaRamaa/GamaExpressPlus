import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth, requireRole("ADMIN", "SUPER_ADMIN"));

// Dashboard summary
router.get("/analytics/summary", async (_req, res) => {
  const [totalOrders, totalRevenue, totalUsers, totalProducts, lowStock, pendingReviews, openQuotes] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalEur: true }, where: { paymentStatus: "PAID" } }),
      prisma.user.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { stockStatus: { in: ["LOW_STOCK", "OUT_OF_STOCK"] } } }),
      prisma.review.count({ where: { status: "PENDING" } }),
      prisma.quoteRequest.count({ where: { status: "REQUESTED" } }),
    ]);

  res.json({
    totalOrders,
    totalRevenueEur: totalRevenue._sum.totalEur ?? 0,
    totalUsers,
    totalProducts,
    lowStockCount: lowStock,
    pendingReviews,
    openQuotes,
  });
});

router.get("/analytics/sales", async (req, res) => {
  const days = Number(req.query.days) || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, paymentStatus: "PAID" },
    select: { createdAt: true, totalEur: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(orders);
});

// User management
router.get("/users", async (req, res) => {
  const { role, q } = req.query as Record<string, string>;
  const users = await prisma.user.findMany({
    where: {
      role: role as any,
      ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { companyName: { contains: q, mode: "insensitive" } }] } : {}),
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isBusinessAccount: true, companyName: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

router.patch("/users/:id", async (req, res) => {
  const { role, wholesaleTier, wholesaleDiscountPct, isBusinessAccount } = req.body ?? {};
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role, wholesaleTier, wholesaleDiscountPct, isBusinessAccount },
  });
  res.json(user);
});

// Inventory
router.get("/inventory/low-stock", async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { stockStatus: { in: ["LOW_STOCK", "OUT_OF_STOCK"] } },
    include: { warehouseStock: { include: { warehouse: true } } },
  });
  res.json(products);
});

router.patch("/inventory/:productId/stock", async (req, res) => {
  const { warehouseId, quantity } = req.body ?? {};
  const stock = await prisma.warehouseStock.upsert({
    where: { warehouseId_productId: { warehouseId, productId: req.params.productId } },
    update: { quantity },
    create: { warehouseId, productId: req.params.productId, quantity },
  });

  const total = await prisma.warehouseStock.aggregate({
    where: { productId: req.params.productId },
    _sum: { quantity: true },
  });
  const totalQty = total._sum.quantity ?? 0;
  await prisma.product.update({
    where: { id: req.params.productId },
    data: {
      stockQuantity: totalQty,
      stockStatus: totalQty === 0 ? "OUT_OF_STOCK" : totalQty <= 5 ? "LOW_STOCK" : "IN_STOCK",
    },
  });

  res.json(stock);
});

// Products — admin listing includes inactive items and supports search
router.get("/products", async (req, res) => {
  const { q, page = "1", limit = "24" } = req.query as Record<string, string>;
  const where: any = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { partNumber: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const take = Math.min(Number(limit) || 24, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, brand: true, category: true },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), limit: take, totalPages: Math.ceil(total / take) });
});

router.get("/products/:id", async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { images: { orderBy: { sortOrder: "asc" } }, brand: true, category: true },
  });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

// Bulk import — validates every row before writing anything, resolving
// brand/category by name (creating them if they don't exist yet), then
// creates all valid rows in a single transaction. Returns a per-row report
// so partial failures are visible instead of silently dropped.
router.post("/products/import", async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (rows.length === 0) return res.status(400).json({ error: "No rows to import" });

  const results: { row: number; sku?: string; status: "created" | "error"; error?: string }[] = [];
  const validRows: any[] = [];

  const existingSkus = new Set(
    (await prisma.product.findMany({ select: { sku: true } })).map((p) => p.sku)
  );
  const seenSkus = new Set<string>();

  rows.forEach((row: any, i: number) => {
    const rowNum = i + 1;
    const sku = String(row.sku || "").trim();
    const title = String(row.title || "").trim();
    const partNumber = String(row.partNumber || "").trim();
    const brandName = String(row.brand || "").trim();
    const categoryName = String(row.category || "").trim();
    const priceEur = Number(row.priceEur);
    const stockQuantity = row.stockQuantity !== undefined ? Number(row.stockQuantity) : 0;

    const rowErrors: string[] = [];
    if (!sku) rowErrors.push("sku is required");
    if (!title) rowErrors.push("title is required");
    if (!partNumber) rowErrors.push("partNumber is required");
    if (!brandName) rowErrors.push("brand is required");
    if (!categoryName) rowErrors.push("category is required");
    if (!Number.isFinite(priceEur) || priceEur < 0) rowErrors.push("priceEur must be a non-negative number");
    if (!Number.isFinite(stockQuantity) || stockQuantity < 0) rowErrors.push("stockQuantity must be a non-negative number");
    if (sku && existingSkus.has(sku)) rowErrors.push(`sku "${sku}" already exists`);
    if (sku && seenSkus.has(sku)) rowErrors.push(`sku "${sku}" is duplicated in this file`);

    if (rowErrors.length > 0) {
      results.push({ row: rowNum, sku: sku || undefined, status: "error", error: rowErrors.join("; ") });
      return;
    }

    seenSkus.add(sku);
    validRows.push({
      rowNum,
      sku,
      slug: sku.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      title,
      partNumber,
      brandName,
      categoryName,
      priceEur,
      stockQuantity,
      shortDescription: row.shortDescription ? String(row.shortDescription) : undefined,
      oemNumbers: row.oemNumbers
        ? String(row.oemNumbers).split(",").map((s: string) => s.trim()).filter(Boolean)
        : [],
    });
  });

  if (validRows.length > 0) {
    await prisma.$transaction(async (tx) => {
      const brandCache = new Map<string, string>();
      const categoryCache = new Map<string, string>();

      for (const row of validRows) {
        try {
          let brandId = brandCache.get(row.brandName);
          if (!brandId) {
            const slug = row.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            const brand = await tx.brand.upsert({
              where: { name: row.brandName },
              update: {},
              create: { name: row.brandName, slug },
            });
            brandId = brand.id;
            brandCache.set(row.brandName, brandId);
          }

          let categoryId = categoryCache.get(row.categoryName);
          if (!categoryId) {
            const slug = row.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            const category = await tx.category.upsert({
              where: { slug },
              update: {},
              create: { name: row.categoryName, slug },
            });
            categoryId = category.id;
            categoryCache.set(row.categoryName, categoryId);
          }

          const stockStatus = row.stockQuantity === 0 ? "OUT_OF_STOCK" : row.stockQuantity <= 5 ? "LOW_STOCK" : "IN_STOCK";

          await tx.product.create({
            data: {
              sku: row.sku,
              slug: row.slug,
              title: row.title,
              partNumber: row.partNumber,
              shortDescription: row.shortDescription,
              oemNumbers: row.oemNumbers,
              priceEur: row.priceEur,
              stockQuantity: row.stockQuantity,
              stockStatus,
              brandId,
              categoryId,
            },
          });

          results.push({ row: row.rowNum, sku: row.sku, status: "created" });
        } catch (err: any) {
          results.push({ row: row.rowNum, sku: row.sku, status: "error", error: err.message });
        }
      }
    });
  }

  results.sort((a, b) => a.row - b.row);
  const created = results.filter((r) => r.status === "created").length;
  res.json({ created, failed: results.length - created, results });
});

// Orders queue
router.get("/orders", async (req, res) => {
  const { status } = req.query as Record<string, string>;
  const orders = await prisma.order.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, companyName: true } }, items: true },
  });
  res.json(orders);
});

export default router;
