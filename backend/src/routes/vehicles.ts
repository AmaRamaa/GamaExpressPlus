import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/makes", async (_req, res) => {
  const makes = await prisma.vehicleMake.findMany({ orderBy: { name: "asc" } });
  res.json(makes);
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

router.get("/generations/:generationId/engines", async (req, res) => {
  const engines = await prisma.vehicleEngine.findMany({
    where: { generationId: req.params.generationId },
    orderBy: { engineCode: "asc" },
  });
  res.json(engines);
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
