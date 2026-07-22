import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, AuthedRequest } from "../middleware/auth";

const router = Router();

router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const { items, notes } = req.body ?? {}; // items: [{ productId, quantity }]
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "At least one item is required" });
  }
  const quote = await prisma.quoteRequest.create({
    data: {
      userId: req.user!.userId,
      notes,
      items: { create: items.map((i: any) => ({ productId: i.productId, quantity: i.quantity })) },
    },
    include: { items: true },
  });
  res.status(201).json(quote);
});

router.get("/mine", requireAuth, async (req: AuthedRequest, res) => {
  const quotes = await prisma.quoteRequest.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  res.json(quotes);
});

router.get("/", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (_req, res) => {
  const quotes = await prisma.quoteRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, user: { select: { companyName: true, email: true } } },
  });
  res.json(quotes);
});

router.patch("/:id/respond", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  const { status, quotedTotalEur, itemPrices } = req.body ?? {}; // itemPrices: [{ id, quotedUnitPriceEur }]
  if (Array.isArray(itemPrices)) {
    await Promise.all(
      itemPrices.map((i: any) =>
        prisma.quoteItem.update({ where: { id: i.id }, data: { quotedUnitPriceEur: i.quotedUnitPriceEur } })
      )
    );
  }
  const quote = await prisma.quoteRequest.update({
    where: { id: req.params.id },
    data: { status, quotedTotalEur, respondedAt: new Date() },
  });
  res.json(quote);
});

export default router;
