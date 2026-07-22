import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

// Request an unavailable part
router.post("/part-requests", async (req, res) => {
  const { name, email, phone, vehicleInfo, partDescription, oemNumber } = req.body ?? {};
  if (!name || !email || !partDescription) {
    return res.status(400).json({ error: "name, email and partDescription are required" });
  }
  const request = await prisma.partRequest.create({
    data: { name, email, phone, vehicleInfo, partDescription, oemNumber },
  });
  res.status(201).json(request);
});

router.get("/part-requests", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (_req, res) => {
  const requests = await prisma.partRequest.findMany({ orderBy: { createdAt: "desc" } });
  res.json(requests);
});

// Homepage banners
router.get("/banners", async (_req, res) => {
  const banners = await prisma.banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  res.json(banners);
});

router.post("/banners", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  const banner = await prisma.banner.create({ data: req.body });
  res.status(201).json(banner);
});

// Blog
router.get("/blog", async (_req, res) => {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
  });
  res.json(posts);
});

router.get("/blog/:slug", async (req, res) => {
  const post = await prisma.blogPost.findUnique({ where: { slug: req.params.slug } });
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json(post);
});

export default router;
