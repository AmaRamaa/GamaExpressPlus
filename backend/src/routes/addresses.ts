import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthedRequest, res) => {
  const addresses = await prisma.address.findMany({ where: { userId: req.user!.userId } });
  res.json(addresses);
});

router.post("/", async (req: AuthedRequest, res) => {
  const address = await prisma.address.create({ data: { ...req.body, userId: req.user!.userId } });
  res.status(201).json(address);
});

router.put("/:id", async (req: AuthedRequest, res) => {
  const address = await prisma.address.update({ where: { id: req.params.id }, data: req.body });
  res.json(address);
});

router.delete("/:id", async (req: AuthedRequest, res) => {
  await prisma.address.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
