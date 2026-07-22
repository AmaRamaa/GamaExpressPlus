import { Router } from "express";
import Stripe from "stripe";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, AuthedRequest } from "../middleware/auth";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2024-06-20",
});

function generateOrderNumber() {
  return `GE-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
}

// POST /api/orders/checkout
// Body: { shippingAddressId, paymentMethod, discountCode? }
router.post("/checkout", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const { shippingAddressId, paymentMethod, discountCode } = req.body ?? {};

  const cartItems = await prisma.cartItem.findMany({
    where: { userId, savedForLater: false },
    include: { product: true },
  });
  if (cartItems.length === 0) return res.status(400).json({ error: "Cart is empty" });

  const subtotalEur = cartItems.reduce(
    (sum, item) => sum + (item.product.discountPriceEur ?? item.product.priceEur) * item.quantity,
    0
  );

  let discountEur = 0;
  let discountId: string | undefined;
  if (discountCode) {
    const code = await prisma.discountCode.findUnique({ where: { code: discountCode } });
    if (code?.isActive && code.validTo > new Date()) {
      discountId = code.id;
      discountEur = code.type === "PERCENTAGE" ? subtotalEur * (code.value / 100) : code.value;
    }
  }

  const shippingEur = subtotalEur > 100 ? 0 : 4.99;
  const vatEur = (subtotalEur - discountEur) * 0.18;
  const totalEur = subtotalEur - discountEur + shippingEur + vatEur;

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId,
      shippingAddressId,
      paymentMethod,
      subtotalEur,
      discountEur,
      shippingEur,
      vatEur,
      totalEur,
      discountCodeId: discountId,
      items: {
        create: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPriceEur: item.product.discountPriceEur ?? item.product.priceEur,
          totalEur: (item.product.discountPriceEur ?? item.product.priceEur) * item.quantity,
        })),
      },
    },
    include: { items: true },
  });

  let clientSecret: string | null = null;
  if (paymentMethod === "STRIPE") {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(totalEur * 100),
      currency: "eur",
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    });
    await prisma.order.update({ where: { id: order.id }, data: { stripePaymentIntentId: intent.id } });
    clientSecret = intent.client_secret;
  }

  // Cash on delivery / bank transfer: order stays PENDING/UNPAID until fulfilled or confirmed.
  await prisma.cartItem.deleteMany({ where: { userId, savedForLater: false } });

  res.status(201).json({ order, clientSecret });
});

router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: { include: { images: { take: 1 } } } } } },
  });
  res.json(orders);
});

router.get("/:orderNumber", requireAuth, async (req: AuthedRequest, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: { items: { include: { product: true } }, shippingAddress: true, invoice: true },
  });
  if (!order || order.userId !== req.user!.userId) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

// Admin: update order status / tracking
router.patch("/:id/status", requireAuth, requireRole("ADMIN", "SUPER_ADMIN", "WAREHOUSE_STAFF"), async (req, res) => {
  const { status, trackingNumber, trackingCarrier } = req.body ?? {};
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status, trackingNumber, trackingCarrier },
  });
  res.json(order);
});

export default router;
