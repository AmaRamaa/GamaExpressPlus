import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthedRequest, res) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.user!.userId },
    include: { product: { include: { images: { take: 1 } } } },
  });
  res.json(items);
});

router.post("/", async (req: AuthedRequest, res) => {
  const { productId } = req.body ?? {};
  const item = await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: req.user!.userId, productId } },
    update: {},
    create: { userId: req.user!.userId, productId },
  });
  res.status(201).json(item);
});

router.delete("/:productId", async (req: AuthedRequest, res) => {
  await prisma.wishlistItem.delete({
    where: { userId_productId: { userId: req.user!.userId, productId: req.params.productId } },
  });
  res.status(204).send();
});

export default router;
