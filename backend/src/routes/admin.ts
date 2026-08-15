import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// Everything below defaults to ADMIN/SUPER_ADMIN only. The two product-listing
// routes also allow STAFF_PIN (temporary shared-code access, see auth.ts's
// POST /pin) so staff entering products from their phones can see the list
// they're building without getting real admin visibility into orders/users.
const adminOnly = requireRole("ADMIN", "SUPER_ADMIN");
const adminOrStaffPin = requireRole("ADMIN", "SUPER_ADMIN", "STAFF_PIN");
// Creating/editing/deleting staff accounts is the most sensitive action in the
// panel (it can mint new admins), so it's gated tighter than the rest of admin.
const superAdminOnly = requireRole("SUPER_ADMIN");
// Order fulfillment is Support's day-to-day job, not just Admin's.
const supportOrAdmin = requireRole("SUPPORT", "ADMIN", "SUPER_ADMIN");

// The 4 staff/admin tiers assignable from the panel -- CUSTOMER/BUSINESS are
// storefront self-registration roles and can't be created here.
const STAFF_ROLES = ["WAREHOUSE_STAFF", "SUPPORT", "ADMIN", "SUPER_ADMIN"] as const;

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(STAFF_ROLES),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(STAFF_ROLES).optional(),
  wholesaleTier: z.string().optional(),
  wholesaleDiscountPct: z.number().optional(),
  isBusinessAccount: z.boolean().optional(),
});

// Dashboard summary
router.get("/analytics/summary", adminOnly, async (_req, res) => {
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

router.get("/analytics/sales", adminOnly, async (req, res) => {
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
router.get("/users", adminOnly, async (req, res) => {
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

router.post("/users", superAdminOnly, async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password, firstName, lastName, role } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, firstName, lastName, role, emailVerified: true },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isBusinessAccount: true, companyName: true, createdAt: true },
  });
  res.status(201).json(user);
});

router.patch("/users/:id", superAdminOnly, async (req: AuthedRequest, res) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (parsed.data.role && parsed.data.role !== "SUPER_ADMIN") {
    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { role: true } });
    if (target?.role === "SUPER_ADMIN") {
      const remaining = await prisma.user.count({ where: { role: "SUPER_ADMIN", id: { not: req.params.id } } });
      if (remaining === 0) return res.status(400).json({ error: "Can't demote the last Super Admin." });
    }
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: parsed.data,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isBusinessAccount: true, companyName: true, createdAt: true },
    });
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/users/:id", superAdminOnly, async (req: AuthedRequest, res) => {
  if (req.params.id === req.user?.userId) {
    return res.status(400).json({ error: "You can't delete your own account." });
  }

  const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { role: true } });
  if (!target) return res.status(404).json({ error: "User not found" });

  if (target.role === "SUPER_ADMIN") {
    const remaining = await prisma.user.count({ where: { role: "SUPER_ADMIN", id: { not: req.params.id } } });
    if (remaining === 0) return res.status(400).json({ error: "Can't delete the last Super Admin." });
  }

  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(400).json({ error: "This user has orders or other records on file and can't be deleted. Consider changing their role instead." });
  }
});

// Inventory
router.get("/inventory/low-stock", adminOnly, async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { stockStatus: { in: ["LOW_STOCK", "OUT_OF_STOCK"] } },
    include: { warehouseStock: { include: { warehouse: true } } },
  });
  res.json(products);
});

router.patch("/inventory/:productId/stock", adminOnly, async (req, res) => {
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
router.get("/products", adminOrStaffPin, async (req, res) => {
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

// Feeds the bulk background-removal tool: every active product's full image
// set (not just the list thumbnail) in one call, so the tool can skip
// already-processed photos (originalUrl set) and knows the complete image
// array to resend on each PUT (product image updates are full-replace).
router.get("/products/all-images", adminOnly, async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      images: {
        orderBy: { sortOrder: "asc" },
        select: { url: true, originalUrl: true, altText: true, sortOrder: true },
      },
    },
  });
  res.json(products);
});

router.get("/products/:id", adminOrStaffPin, async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      brand: true,
      category: true,
      compatibility: {
        include: {
          engine: { include: { generation: { include: { model: { include: { make: true } } } } } },
        },
      },
    },
  });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

// Bulk import — validates every row before writing anything, resolving
// brand/category by name (creating them if they don't exist yet), then
// creates all valid rows in a single transaction. Returns a per-row report
// so partial failures are visible instead of silently dropped.
router.post("/products/import", adminOnly, async (req, res) => {
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
router.get("/orders", supportOrAdmin, async (req, res) => {
  const { status } = req.query as Record<string, string>;
  const orders = await prisma.order.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, companyName: true } }, items: true },
  });
  res.json(orders);
});

const ORDER_STATUSES = [
  "PENDING", "PAID", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY",
  "DELIVERED", "CANCELLED", "REFUNDED", "RETURN_REQUESTED",
] as const;
const orderStatusSchema = z.object({ status: z.enum(ORDER_STATUSES) });

router.patch("/orders/:id/status", supportOrAdmin, async (req, res) => {
  const parsed = orderStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
    });
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
