import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  isBusinessAccount: z.boolean().optional(),
  companyName: z.string().optional(),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password, firstName, lastName, phone, isBusinessAccount, companyName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const passwordHash = await bcrypt.hash(password, 12);
  const emailVerifyToken = crypto.randomBytes(32).toString("hex");

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      isBusinessAccount: !!isBusinessAccount,
      companyName,
      emailVerifyToken,
    },
  });

  // TODO: send verification email via nodemailer using emailVerifyToken

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

  res.status(201).json({
    accessToken,
    refreshToken,
    user: {
      id: user.id, email: user.email, firstName, lastName, role: user.role,
      isBusinessAccount: user.isBusinessAccount, companyName: user.companyName,
      wholesaleDiscountPct: user.wholesaleDiscountPct,
    },
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid email or password" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid email or password" });

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role,
      isBusinessAccount: user.isBusinessAccount, companyName: user.companyName,
      wholesaleDiscountPct: user.wholesaleDiscountPct,
    },
  });
});

// Shared-PIN login for staff who register products from their own phones
// without an individual account. Not tied to any DB user -- the JWT carries
// a synthetic userId/role that requireRole checks like any other role string.
router.post("/pin", async (req, res) => {
  const staffPinCode = process.env.STAFF_PIN_CODE;
  if (!staffPinCode) {
    return res.status(503).json({ error: "Staff PIN login is not configured" });
  }

  const { code, staffName } = req.body ?? {};
  if (code !== staffPinCode) {
    return res.status(401).json({ error: "Invalid code" });
  }

  // Longer-lived than the shared signAccessToken default (15m) since staff
  // will keep this session open on a device all day -- signed here directly
  // rather than changing signAccessToken's expiry for everyone.
  const accessSecret = process.env.JWT_ACCESS_SECRET || "dev-access-secret";
  const accessToken = jwt.sign({ userId: "staff-pin", role: "STAFF_PIN" }, accessSecret, {
    expiresIn: "24h",
  });

  res.json({
    accessToken,
    refreshToken: null,
    user: {
      id: "staff-pin",
      email: "staff@device.local",
      firstName: typeof staffName === "string" && staffName.trim() ? staffName.trim() : "Staff",
      lastName: "",
      role: "STAFF_PIN",
    },
  });
});

// Google OAuth: frontend exchanges Google's id_token here.
// Requires GOOGLE_CLIENT_ID configured; verifying the id_token is left as an
// integration step (e.g. via google-auth-library) once credentials are provisioned.
router.post("/google", async (req, res) => {
  const { email, firstName, lastName, googleId } = req.body ?? {};
  if (!email || !googleId) return res.status(400).json({ error: "Missing Google profile data" });

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, googleId, firstName: firstName || "Google", lastName: lastName || "User", emailVerified: true },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({ where: { id: user.id }, data: { googleId } });
  }

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role });
  res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (!refreshToken) return res.status(400).json({ error: "Missing refresh token" });
  try {
    const payload = verifyRefreshToken(refreshToken);
    const accessToken = signAccessToken(payload);
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body ?? {};
  const user = await prisma.user.findUnique({ where: { email } });
  // Always respond 200 to avoid leaking which emails are registered
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: new Date(Date.now() + 1000 * 60 * 60) },
    });
    // TODO: email the reset link containing `token`
  }
  res.json({ message: "If that email exists, a reset link has been sent." });
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body ?? {};
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: token, passwordResetExpires: { gt: new Date() } },
  });
  if (!user) return res.status(400).json({ error: "Invalid or expired reset token" });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
  });
  res.json({ message: "Password updated successfully" });
});

router.get("/verify-email/:token", async (req, res) => {
  const user = await prisma.user.findFirst({ where: { emailVerifyToken: req.params.token } });
  if (!user) return res.status(400).json({ error: "Invalid verification token" });
  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, emailVerifyToken: null } });
  res.json({ message: "Email verified" });
});

export default router;
