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
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

const brandWriteSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  logoUrl: z.string().optional(),
  isOEM: z.boolean().optional(),
});

const manufacturerWriteSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  logoUrl: z.string().optional(),
});

router.get("/categories", async (_req, res) => {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: { include: { _count: { select: { products: true } } }, orderBy: { sortOrder: "asc" } },
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

router.get("/categories/:id", async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: {
      parent: true,
      children: { include: { _count: { select: { products: true } } } },
      _count: { select: { products: true } },
    },
  });
  if (!category) return res.status(404).json({ error: "Category not found" });
  const productCount =
    category._count.products + category.children.reduce((sum, ch: any) => sum + ch._count.products, 0);
  res.json({ ...category, productCount });
});

router.post("/categories", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  const parsed = categoryWriteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const category = await prisma.category.create({ data: parsed.data });
    res.status(201).json(category);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/categories/:id", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  const parsed = categoryWriteSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  if (parsed.data.parentId === req.params.id) {
    return res.status(400).json({ error: "A category cannot be its own parent" });
  }
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
  if (productCount > 0) {
    return res.status(409).json({ error: `Cannot delete: ${productCount} product(s) are in this category.` });
  }
  if (childCount > 0) {
    return res.status(409).json({ error: `Cannot delete: this category has ${childCount} subcategory(ies).` });
  }
  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

router.get("/brands", async (_req, res) => {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  res.json(brands.map((b) => ({ ...b, productCount: b._count.products })));
});

router.get("/brands/:id", async (req, res) => {
  const brand = await prisma.brand.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { products: true } } },
  });
  if (!brand) return res.status(404).json({ error: "Brand not found" });
  res.json({ ...brand, productCount: brand._count.products });
});

router.post("/brands", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  const parsed = brandWriteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const brand = await prisma.brand.create({ data: parsed.data });
    res.status(201).json(brand);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/brands/:id", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
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
  if (productCount > 0) {
    return res.status(409).json({ error: `Cannot delete: ${productCount} product(s) use this brand.` });
  }
  await prisma.brand.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

router.get("/manufacturers", async (_req, res) => {
  const manufacturers = await prisma.manufacturer.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  res.json(manufacturers.map((m) => ({ ...m, productCount: m._count.products })));
});

router.get("/manufacturers/:id", async (req, res) => {
  const manufacturer = await prisma.manufacturer.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { products: true } } },
  });
  if (!manufacturer) return res.status(404).json({ error: "Manufacturer not found" });
  res.json({ ...manufacturer, productCount: manufacturer._count.products });
});

router.post("/manufacturers", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  const parsed = manufacturerWriteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const manufacturer = await prisma.manufacturer.create({ data: parsed.data });
    res.status(201).json(manufacturer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/manufacturers/:id", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  const parsed = manufacturerWriteSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const manufacturer = await prisma.manufacturer.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(manufacturer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/manufacturers/:id", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  const productCount = await prisma.product.count({ where: { manufacturerId: req.params.id } });
  if (productCount > 0) {
    return res.status(409).json({ error: `Cannot delete: ${productCount} product(s) use this manufacturer.` });
  }
  await prisma.manufacturer.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
