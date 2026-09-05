import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, requirePrintServiceApiKey } from "../middleware/auth";

const router = Router();

// POST /api/print-events -- called by the external label-printing service,
// not a logged-in user, so it's gated by requirePrintServiceApiKey (a static
// API key) instead of the normal JWT auth. Body shape is a best guess ahead
// of that service's actual spec -- adjust field names here once it's known.
const printEventSchema = z
  .object({
    externalJobId: z.string().min(1),
    status: z.enum(["PRINTED", "FAILED"]),
    productId: z.string().optional(),
    sku: z.string().optional(),
    message: z.string().optional(),
  })
  .refine((data) => data.productId || data.sku, {
    message: "Provide productId and/or sku so the event can be tied to a product",
  });

router.post("/", requirePrintServiceApiKey, async (req, res) => {
  const parsed = printEventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { externalJobId, status, productId, sku, message } = parsed.data;

  // Resolve to a real Product where possible -- prefer the explicit id, fall
  // back to looking the sku up. Neither resolving is not an error: the event
  // (and the raw sku the print service sent) is still recorded either way.
  let resolvedProductId: string | null = null;
  if (productId) {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    resolvedProductId = product?.id ?? null;
  }
  if (!resolvedProductId && sku) {
    const product = await prisma.product.findUnique({ where: { sku }, select: { id: true } });
    resolvedProductId = product?.id ?? null;
  }

  try {
    const event = await prisma.printEvent.create({
      data: { externalJobId, status, sku, message, productId: resolvedProductId },
    });
    res.status(201).json(event);
  } catch (err: any) {
    // A retried/duplicate webhook delivery for a job we've already recorded
    // -- treat it as a harmless no-op (return the existing row) rather than
    // a 500, so the print service's retry logic doesn't need special-casing.
    if (err.code === "P2002") {
      const existing = await prisma.printEvent.findUnique({ where: { externalJobId } });
      return res.status(200).json(existing);
    }
    throw err;
  }
});

// GET /api/print-events -- feeds the admin "Printed files" dashboard page.
// Normal admin auth (unlike the intake route above), same list+paginate
// shape as the other admin list endpoints in this app.
router.get("/", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));

  const [items, total] = await Promise.all([
    prisma.printEvent.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { product: { select: { id: true, title: true, sku: true, slug: true } } },
    }),
    prisma.printEvent.count(),
  ]);

  res.json({ items, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
});

export default router;
