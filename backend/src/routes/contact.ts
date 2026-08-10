import { Router, Response } from "express";
import { z } from "zod";
import { sendContactMail } from "../lib/mailer";

const router = Router();

async function handleSend(
  res: Response,
  subject: string,
  lines: Array<[string, string | undefined]>,
  replyTo: string
) {
  const text = lines
    .filter(([, value]) => value && value.trim())
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");

  try {
    await sendContactMail({ subject, text, replyTo });
    res.json({ message: "Sent" });
  } catch (err) {
    console.error("[contact] failed to send email:", err);
    res.status(503).json({ error: "Could not send your message right now. Please call or WhatsApp us instead." });
  }
}

const contactSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
});

router.post("/", async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { fullName, email, subject, message } = parsed.data;

  await handleSend(
    res,
    `[Contact] ${subject}`,
    [
      ["Name", fullName],
      ["Email", email],
      ["Message", message],
    ],
    email
  );
});

const quoteSchema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  volume: z.string().optional(),
  partsNeeded: z.string().min(1),
});

router.post("/quote", async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { companyName, contactName, email, phone, volume, partsNeeded } = parsed.data;

  await handleSend(
    res,
    `[Bulk Quote Request] ${companyName}`,
    [
      ["Company", companyName],
      ["Contact name", contactName],
      ["Email", email],
      ["Phone", phone],
      ["Estimated monthly volume", volume],
      ["Parts needed", partsNeeded],
    ],
    email
  );
});

const requestPartSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  vehicle: z.string().optional(),
  oem: z.string().optional(),
  partDesc: z.string().min(1),
});

router.post("/request-part", async (req, res) => {
  const parsed = requestPartSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { fullName, email, phone, vehicle, oem, partDesc } = parsed.data;

  await handleSend(
    res,
    `[Part Request] ${fullName}`,
    [
      ["Name", fullName],
      ["Email", email],
      ["Phone", phone],
      ["Vehicle", vehicle],
      ["OEM number", oem],
      ["Part description", partDesc],
    ],
    email
  );
});

export default router;
