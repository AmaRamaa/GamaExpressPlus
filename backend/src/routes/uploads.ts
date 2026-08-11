import { Router } from "express";
import multer from "multer";
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
const storage = storageConfigured
  ? new StorageClient(`${supabaseUrl}/storage/v1`, {
      apikey: supabaseServiceRoleKey!,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
    })
  : null;

export const BUCKET = "product-images";

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

    const sanitizedName = req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${sanitizedName}`;

    try {
      const { error: uploadError } = await storage
        .from(BUCKET)
        .upload(path, req.file.buffer, { contentType: req.file.mimetype });

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
