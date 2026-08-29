import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { StorageClient } from "@supabase/storage-js";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const storageConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

// Using the standalone @supabase/storage-js client instead of the full
// @supabase/supabase-js -- the full client's Realtime subsystem requires a
// native WebSocket global, which only exists from Node 22+. Railway currently
// runs Node 18, so createClient() from supabase-js crashes the process on
// startup. We only ever use Storage here, so the lightweight client (no
// Realtime, no WebSocket dependency) sidesteps the issue entirely.
// The service role key bypasses Row Level Security -- this client must never be
// sent to the frontend or used outside of trusted server-side code.
export const storage = storageConfigured
  ? new StorageClient(`${supabaseUrl}/storage/v1`, {
      apikey: supabaseServiceRoleKey!,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
    })
  : null;

export const BUCKET = "product-images";

// Uploaded photos come straight off admins' phones/cameras -- easily 4-10MB
// and several thousand pixels wide -- but are only ever displayed as card
// thumbnails or a single product-detail hero, never anywhere near that size.
// Downscaling once here (instead of shipping the original to every visitor)
// is what makes product listings fast: a 300px grid card has no business
// pulling down a 4000px photo. WebP keeps transparency (background-removed
// photos are PNGs) at a fraction of the file size of the source format.
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 82;

if (!storageConfigured) {
  console.warn(
    "[uploads] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set — photo uploads will fail until configured."
  );
} else {
  // Ensure the bucket exists once at module load; don't crash the server if this fails.
  (async () => {
    try {
      const { data: existingBucket, error: getError } = await storage!.getBucket(BUCKET);
      if (!existingBucket || getError) {
        const { error: createError } = await storage!.createBucket(BUCKET, { public: true });
        if (createError) {
          console.error("[uploads] Failed to create Supabase Storage bucket:", createError.message);
        }
      }
    } catch (err) {
      console.error("[uploads] Failed to verify/create Supabase Storage bucket:", err);
    }
  })();
}

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "SUPER_ADMIN", "STAFF_PIN"),
  upload.single("file"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    if (!storage) {
      console.error("[uploads] Upload attempted but Supabase Storage is not configured");
      return res.status(502).json({ error: "Photo upload failed" });
    }

    const sanitizedBaseName = req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_").replace(/\.[^.]+$/, "");
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${sanitizedBaseName}.webp`;

    let optimized: Buffer;
    try {
      optimized = await sharp(req.file.buffer)
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
    } catch (err) {
      console.error("[uploads] Failed to process image:", err);
      return res.status(400).json({ error: "That file doesn't look like a valid image" });
    }

    try {
      const { error: uploadError } = await storage
        .from(BUCKET)
        .upload(path, optimized, { contentType: "image/webp" });

      if (uploadError) {
        console.error("[uploads] Supabase upload error:", uploadError.message);
        return res.status(502).json({ error: "Photo upload failed" });
      }

      const { data: publicUrlData } = storage.from(BUCKET).getPublicUrl(path);

      res.status(201).json({ url: publicUrlData.publicUrl, path });
    } catch (err) {
      console.error("[uploads] Unexpected error during photo upload:", err);
      return res.status(502).json({ error: "Photo upload failed" });
    }
  }
);

export default router;
