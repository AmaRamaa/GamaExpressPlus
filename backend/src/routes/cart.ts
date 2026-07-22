import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthedRequest, res) => {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user!.userId },
    include: { product: { include: { images: { take: 1 } } } },
  });
  res.json(items);
});

router.post("/", async (req: AuthedRequest, res) => {
  const { productId, quantity = 1 } = req.body ?? {};
  const item = await prisma.cartItem.upsert({
    where: { userId_productId: { userId: req.user!.userId, productId } },
    update: { quantity: { increment: quantity } },
    create: { userId: req.user!.userId, productId, quantity },
  });
  res.status(201).json(item);
});

router.patch("/:id", async (req: AuthedRequest, res) => {
  const { quantity, savedForLater } = req.body ?? {};
  const item = await prisma.cartItem.update({
    where: { id: req.params.id },
    data: { quantity, savedForLater },
  });
  res.json(item);
});

router.delete("/:id", async (req: AuthedRequest, res) => {
  await prisma.cartItem.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
