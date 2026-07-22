import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, AuthedRequest } from "../middleware/auth";

const router = Router();

router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const { productId, rating, title, comment } = req.body ?? {};
  if (!productId || !rating) return res.status(400).json({ error: "productId and rating are required" });

  const review = await prisma.review.create({
    data: { productId, userId: req.user!.userId, rating, title, comment },
  });
  res.status(201).json(review);
});

// Admin moderation
router.get("/pending", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (_req, res) => {
  const reviews = await prisma.review.findMany({
    where: { status: "PENDING" },
    include: { product: { select: { title: true } }, user: { select: { firstName: true, lastName: true } } },
  });
  res.json(reviews);
});

router.patch("/:id/moderate", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  const { status } = req.body ?? {}; // APPROVED | REJECTED
  const review = await prisma.review.update({ where: { id: req.params.id }, data: { status } });
  res.json(review);
});

export default router;
