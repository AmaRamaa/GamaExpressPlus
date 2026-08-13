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

router.patch("/categories/:id", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  const parsed = categoryWriteSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const category = await prisma.category.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(category);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/categories/:id", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  const [productCount, childCount] = await Promise.all([
    prisma.product.count({ where: { categoryId: req.params.id } }),
    prisma.category.count({ where: { parentId: req.params.id } }),
  ]);
  if (productCount > 0) return res.status(400).json({ error: `Can't delete: ${productCount} product(s) still use this category. Move them first.` });
  if (childCount > 0) return res.status(400).json({ error: `Can't delete: this category has ${childCount} subcategor${childCount === 1 ? "y" : "ies"}. Delete those first.` });

  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).send();
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

router.patch("/brands/:id", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  const parsed = brandWriteSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const brand = await prisma.brand.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(brand);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/brands/:id", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  const productCount = await prisma.product.count({ where: { brandId: req.params.id } });
  if (productCount > 0) return res.status(400).json({ error: `Can't delete: ${productCount} product(s) still use this brand. Move them first.` });

  await prisma.brand.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

router.get("/manufacturers", async (_req, res) => {
  const manufacturers = await prisma.manufacturer.findMany({ orderBy: { name: "asc" } });
  res.json(manufacturers);
});

export default router;
