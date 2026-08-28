import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { storage, storageConfigured, BUCKET } from "./uploads";

const router = Router();
const adminOnly = [requireAuth, requireRole("ADMIN", "SUPER_ADMIN")];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 4 },
});

// Public, unauthenticated, and costs a Claude call per submission -- keep it
// tight so this can't be used to spam the review queue or run up API spend.
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions from this connection. Please try again later." },
});

const submitSchema = z.object({
  submitterName: z.string().min(1),
  submitterEmail: z.string().email(),
  submitterPhone: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
});

// Screens a customer-submitted listing before it ever reaches an admin: is
// this actually a car part (any condition/category, not just the exterior
// parts this store stocks today) rather than junk, a non-automotive item, or
// spam. Mirrors the conventions of analyzeProductPhotos/translateProductFields
// in routes/products.ts (same model, same json_schema output pattern) but is
// its own function since the prompt/schema are unrelated to those.
async function classifySubmission(submissionId: string) {
  if (!process.env.ANTHROPIC_API_KEY) return; // leave it PENDING for manual review

  const submission = await prisma.productSubmission.findUnique({ where: { id: submissionId } });
  if (!submission) return;

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    system:
      "You screen listings submitted by the public to a Kosovo auto-parts store that wants to buy used/surplus car parts from customers. " +
      "Given a title, description and photo(s), decide whether this is genuinely a car part (any part, new or used, any condition) as opposed to " +
      "something else entirely (a non-automotive item, a random photo, spam, or an empty/nonsense listing). Be lenient on condition and photo " +
      "quality -- only reject when it clearly isn't a car part at all. Give a one-sentence reason either way.",
    messages: [
      {
        role: "user",
        content: [
          ...submission.images.map((url) => ({ type: "image" as const, source: { type: "url" as const, url } })),
          {
            type: "text" as const,
            text: `Title: ${submission.title}\nDescription: ${submission.description || "(none provided)"}`,
          },
        ],
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            isCarPart: { type: "boolean" },
            reasoning: { type: "string" },
          },
          required: ["isCarPart", "reasoning"],
          additionalProperties: false,
        },
      },
    },
  });

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) throw new Error("The AI didn't return a usable verdict.");

  const resultSchema = z.object({ isCarPart: z.boolean(), reasoning: z.string() });
  const result = resultSchema.safeParse(JSON.parse(textBlock.text));
  if (!result.success) throw new Error("The AI's response didn't match the expected format.");

  await prisma.productSubmission.update({
    where: { id: submissionId },
    data: {
      status: result.data.isCarPart ? "APPROVED" : "REJECTED",
      aiIsCarPart: result.data.isCarPart,
      aiReasoning: result.data.reasoning,
    },
  });
}

// POST /api/submissions -- public, no auth. multipart: text fields + up to 4
// "images" files. Creates the submission, uploads its photos, then runs the
// AI screen inline (a single Claude call, same as the admin "Analyze photos"
// button) so the visitor sees the outcome immediately instead of polling.
router.post("/", submitLimiter, upload.array("images", 4), async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const files = (req.files as Express.Multer.File[] | undefined) || [];
  if (files.length === 0) return res.status(400).json({ error: "At least one photo is required." });

  if (!storageConfigured || !storage) {
    console.error("[submissions] Submission attempted but Supabase Storage is not configured");
    return res.status(502).json({ error: "Photo upload isn't available right now. Please try again later." });
  }

  const imageUrls: string[] = [];
  for (const file of files) {
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `submissions/${Date.now()}-${Math.random().toString(36).slice(2)}-${sanitizedName}`;
    const { error: uploadError } = await storage.from(BUCKET).upload(path, file.buffer, { contentType: file.mimetype });
    if (uploadError) {
      console.error("[submissions] Supabase upload error:", uploadError.message);
      return res.status(502).json({ error: "Photo upload failed. Please try again." });
    }
    imageUrls.push(storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  }

  const submission = await prisma.productSubmission.create({
    data: { ...parsed.data, images: imageUrls },
  });

  try {
    await classifySubmission(submission.id);
  } catch (err: any) {
    console.error("Submission AI screen failed:", err.message);
    // Left as PENDING -- still visible to admins, just without a verdict.
  }

  const final = await prisma.productSubmission.findUnique({ where: { id: submission.id } });
  res.status(201).json(final);
});

// Everything below is admin-only review/promotion tooling.

router.get("/", ...adminOnly, async (req, res) => {
  const { status } = req.query as Record<string, string>;
  const submissions = await prisma.productSubmission.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { createdAt: "desc" },
  });
  res.json(submissions);
});

router.get("/:id", ...adminOnly, async (req, res) => {
  const submission = await prisma.productSubmission.findUnique({ where: { id: req.params.id } });
  if (!submission) return res.status(404).json({ error: "Submission not found" });
  res.json(submission);
});

// Lets an admin overrule the AI's verdict either direction before promoting
// (or to reject something the AI let through) -- promotion itself always
// goes through /:id/promote instead, so status can't be hand-set to PROMOTED.
const overrideSchema = z.object({ status: z.enum(["APPROVED", "REJECTED"]) });
router.patch("/:id", ...adminOnly, async (req, res) => {
  const parsed = overrideSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const submission = await prisma.productSubmission.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(submission);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Called after the admin panel has created the real Product (via the normal
// product form, pre-filled from this submission) -- just links the two
// records and closes out the submission.
const promoteSchema = z.object({ productId: z.string().min(1) });
router.post("/:id/promote", ...adminOnly, async (req, res) => {
  const parsed = promoteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const submission = await prisma.productSubmission.update({
      where: { id: req.params.id },
      data: { status: "PROMOTED", promotedProductId: parsed.data.productId },
    });
    res.json(submission);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", ...adminOnly, async (req, res) => {
  await prisma.productSubmission.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
