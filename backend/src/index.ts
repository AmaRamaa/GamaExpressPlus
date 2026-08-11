import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import vehicleRoutes from "./routes/vehicles";
import catalogRoutes from "./routes/catalog";
import searchRoutes from "./routes/search";
import cartRoutes from "./routes/cart";
import wishlistRoutes from "./routes/wishlist";
import addressRoutes from "./routes/addresses";
import orderRoutes from "./routes/orders";
import reviewRoutes from "./routes/reviews";
import quoteRoutes from "./routes/quotes";
import contentRoutes from "./routes/content";
import adminRoutes from "./routes/admin";
import uploadRoutes from "./routes/uploads";
import contactRoutes from "./routes/contact";
import { prisma } from "./lib/prisma";

const app = express();
const PORT = process.env.PORT || 4000;

// Railway (and most PaaS hosts) sit behind a single reverse proxy that sets
// X-Forwarded-For with the real client IP. Trusting exactly one hop lets
// express-rate-limit key off the actual client instead of the proxy itself,
// without blindly trusting an arbitrary chain (which would let a client
// spoof their own IP via the header).
app.set("trust proxy", 1);

function getHostArg(): string | undefined {
  const idx = process.argv.indexOf("--host");
  return idx !== -1 ? process.argv[idx + 1] : process.env.HOST;
}
const HOST = getHostArg();

app.use(helmet());
// Known production frontend is always allowed regardless of how CORS_ORIGIN
// is (mis)configured on the host — Railway's env var only adds to this list,
// it can't accidentally lock the real frontend out.
const DEFAULT_ORIGINS = ["https://gama-express-plus.vercel.app", "http://localhost:3000"];
const envOrigins = process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()).filter(Boolean) ?? [];
const allowedOrigins = [...new Set([...DEFAULT_ORIGINS, ...envOrigins])];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

// Generic API rate limiter.
app.use(
  "/api",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false })
);

// Tighter limiter on credential-guessing-prone auth routes (login, register,
// password reset) — brute force / credential stuffing protection.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

// Keeps the contact/quote/request-part forms from being used as a spam relay.
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please call or WhatsApp us instead." },
});

app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/pin", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/contact", contactLimiter, contactRoutes);

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const server = HOST
  ? app.listen(Number(PORT), HOST, () => {
      console.log(`Gama Express API running on http://${HOST}:${PORT}`);
    })
  : app.listen(PORT, () => {
      console.log(`Gama Express API running on http://localhost:${PORT}`);
    });

// Hosts like Railway send SIGTERM on every redeploy/restart. Without this,
// the process gets killed mid-flight and leaves its database connection
// dangling on Supabase's pooler until it eventually times out -- across
// enough restarts that exhausts the pooler's connection limit outright.
// Closing the DB connection and HTTP server explicitly here means a
// redeploy releases its connection immediately instead of leaking it.
function shutdown(signal: string) {
  console.log(`${signal} received, shutting down gracefully`);
  server.close(() => {
    prisma
      .$disconnect()
      .catch((err) => console.error("Error disconnecting Prisma:", err))
      .finally(() => process.exit(0));
  });
  // Force-exit if graceful shutdown hangs longer than the host's kill timeout would allow.
  setTimeout(() => process.exit(1), 8000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
