import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
const adminOnly = requireRole("ADMIN", "SUPER_ADMIN");

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

router.get("/makes", async (_req, res) => {
  const makes = await prisma.vehicleMake.findMany({ orderBy: { name: "asc" } });
  res.json(makes);
});

const makeWriteSchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().optional(),
});

router.post("/makes", requireAuth, adminOnly, async (req, res) => {
  const parsed = makeWriteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const make = await prisma.vehicleMake.create({
      data: { name: parsed.data.name, slug: slugify(parsed.data.name), logoUrl: parsed.data.logoUrl },
    });
    res.status(201).json(make);
  } catch (err: any) {
    res.status(400).json({ error: err.code === "P2002" ? `Make "${parsed.data.name}" already exists.` : err.message });
  }
});

router.patch("/makes/:id", requireAuth, adminOnly, async (req, res) => {
  const parsed = makeWriteSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const make = await prisma.vehicleMake.update({
      where: { id: req.params.id },
      data: { ...parsed.data, ...(parsed.data.name ? { slug: slugify(parsed.data.name) } : {}) },
    });
    res.json(make);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/makes/:id", requireAuth, adminOnly, async (req, res) => {
  const modelCount = await prisma.vehicleModel.count({ where: { makeId: req.params.id } });
  if (modelCount > 0) return res.status(400).json({ error: `Can't delete: this make has ${modelCount} model(s). Delete those first.` });
  await prisma.vehicleMake.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

router.get("/makes/:makeId/models", async (req, res) => {
  const models = await prisma.vehicleModel.findMany({
    where: { makeId: req.params.makeId },
    orderBy: { name: "asc" },
  });
  res.json(models);
});

router.get("/models/:modelId/generations", async (req, res) => {
  const generations = await prisma.vehicleGeneration.findMany({
    where: { modelId: req.params.modelId },
    orderBy: { yearFrom: "desc" },
  });
  res.json(generations);
});

const modelWriteSchema = z.object({
  makeId: z.string().min(1),
  name: z.string().min(1),
});

router.post("/models", requireAuth, adminOnly, async (req, res) => {
  const parsed = modelWriteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const model = await prisma.vehicleModel.create({
      data: { makeId: parsed.data.makeId, name: parsed.data.name, slug: slugify(parsed.data.name) },
    });
    res.status(201).json(model);
  } catch (err: any) {
    res.status(400).json({ error: err.code === "P2002" ? `Model "${parsed.data.name}" already exists for this make.` : err.message });
  }
});

router.patch("/models/:id", requireAuth, adminOnly, async (req, res) => {
  const parsed = modelWriteSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const model = await prisma.vehicleModel.update({
      where: { id: req.params.id },
      data: { ...parsed.data, ...(parsed.data.name ? { slug: slugify(parsed.data.name) } : {}) },
    });
    res.json(model);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/models/:id", requireAuth, adminOnly, async (req, res) => {
  const generationCount = await prisma.vehicleGeneration.count({ where: { modelId: req.params.id } });
  if (generationCount > 0) return res.status(400).json({ error: `Can't delete: this model has ${generationCount} generation(s). Delete those first.` });
  await prisma.vehicleModel.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

const generationWriteSchema = z.object({
  modelId: z.string().min(1),
  name: z.string().min(1),
  yearFrom: z.number().int(),
  yearTo: z.number().int().nullable().optional(),
  bodyType: z.string().optional(),
});

router.post("/generations", requireAuth, adminOnly, async (req, res) => {
  const parsed = generationWriteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const generation = await prisma.vehicleGeneration.create({ data: parsed.data });
    res.status(201).json(generation);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch("/generations/:id", requireAuth, adminOnly, async (req, res) => {
  const parsed = generationWriteSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const generation = await prisma.vehicleGeneration.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(generation);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/generations/:id", requireAuth, adminOnly, async (req, res) => {
  const compatCount = await prisma.productCompatibility.count({ where: { engine: { generationId: req.params.id } } });
  if (compatCount > 0) return res.status(400).json({ error: `Can't delete: ${compatCount} product(s) are marked compatible with this generation. Remove that fitment first.` });

  await prisma.vehicleGeneration.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

router.get("/generations/:generationId/engines", async (req, res) => {
  const engines = await prisma.vehicleEngine.findMany({
    where: { generationId: req.params.generationId },
    orderBy: { engineCode: "asc" },
  });

  // This business doesn't track fitment by engine (only by generation), and
  // seeded vehicle data doesn't always include real engine rows. Product
  // compatibility still needs *an* engineId to point at (existing schema),
  // so make sure every generation has at least one -- otherwise the admin's
  // "add vehicle" picker has nothing to select and silently can't proceed.
  if (engines.length > 0) return res.json(engines);

  const generation = await prisma.vehicleGeneration.findUnique({ where: { id: req.params.generationId } });
  if (!generation) return res.json([]);

  const placeholder = await prisma.vehicleEngine.create({
    data: {
      generationId: generation.id,
      engineCode: "ALL",
      displacementL: 0,
      fuelType: "PETROL",
      horsePowerHp: 0,
      transmission: "MANUAL",
      yearFrom: generation.yearFrom,
      yearTo: generation.yearTo,
    },
  });
  res.json([placeholder]);
});

// GET /api/vehicles/engines/:engineId/products
router.get("/engines/:engineId/products", async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true, compatibility: { some: { engineId: req.params.engineId } } },
    include: { images: { take: 1 }, brand: true },
  });
  res.json(products);
});

// Basic VIN decode stub — swap in a real VIN decoding provider (e.g. NHTSA vPIC
// for US-market VINs, or a commercial European decoder) behind this same contract.
router.get("/vin/:vin", async (req, res) => {
  const vin = req.params.vin.toUpperCase();
  if (vin.length !== 17) return res.status(400).json({ error: "VIN must be 17 characters" });

  // WMI (first 3 chars) -> rough manufacturer lookup as a placeholder.
  const wmiMap: Record<string, string> = {
    WVW: "Volkswagen", WBA: "BMW", WDD: "Mercedes-Benz", VF1: "Renault",
    VF3: "Peugeot", ZFA: "Fiat", TMB: "Škoda", SAJ: "Jaguar",
  };
  const manufacturer = wmiMap[vin.slice(0, 3)] || "Unknown";

  res.json({
    vin,
    manufacturer,
    note: "Connect a licensed VIN decoding provider for full make/model/engine/year resolution.",
  });
});

export default router;
