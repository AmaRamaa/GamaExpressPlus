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
