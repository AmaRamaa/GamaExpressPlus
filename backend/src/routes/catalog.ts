import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

const categoryWriteSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const brandWriteSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  logoUrl: z.string().optional(),
  isOEM: z.boolean().optional(),
});

router.get("/categories", async (_req, res) => {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: { include: { _count: { select: { products: true } } } },
      _count: { select: { products: true } },
    },
    orderBy: { sortOrder: "asc" },
  });
  const withCounts = categories.map((c) => ({
    ...c,
    productCount: c._count.products + c.children.reduce((sum, ch: any) => sum + ch._count.products, 0),
    children: c.children.map((ch: any) => ({ ...ch, productCount: ch._count.products })),
  }));
  res.json(withCounts);
});

router.post("/categories", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  const parsed = categoryWriteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const category = await prisma.category.create({ data: parsed.data });
  res.status(201).json(category);
});

router.get("/brands", async (_req, res) => {
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
  res.json(brands);
});

router.post("/brands", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  const parsed = brandWriteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const brand = await prisma.brand.create({ data: parsed.data });
  res.status(201).json(brand);
});

router.get("/manufacturers", async (_req, res) => {
  const manufacturers = await prisma.manufacturer.findMany({ orderBy: { name: "asc" } });
  res.json(manufacturers);
});

export default router;
