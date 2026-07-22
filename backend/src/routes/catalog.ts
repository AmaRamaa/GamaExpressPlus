import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.get("/categories", async (_req, res) => {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: true },
    orderBy: { sortOrder: "asc" },
  });
  res.json(categories);
});

router.post("/categories", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  const category = await prisma.category.create({ data: req.body });
  res.status(201).json(category);
});

router.get("/brands", async (_req, res) => {
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
  res.json(brands);
});

router.post("/brands", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  const brand = await prisma.brand.create({ data: req.body });
  res.status(201).json(brand);
});

router.get("/manufacturers", async (_req, res) => {
  const manufacturers = await prisma.manufacturer.findMany({ orderBy: { name: "asc" } });
  res.json(manufacturers);
});

export default router;
