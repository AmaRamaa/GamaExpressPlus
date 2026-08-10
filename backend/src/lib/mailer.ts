import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

export const mailConfigured = Boolean(smtpHost && smtpUser && smtpPass);

const transporter = mailConfigured
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })
  : null;

const MAIL_FROM = process.env.EMAIL_FROM || smtpUser || "no-reply@gamaexpress.local";
const MAIL_TO = process.env.CONTACT_EMAIL_TO || "GamaExpress18@gmail.com";

if (!mailConfigured) {
  console.warn(
    "[mailer] SMTP_HOST/SMTP_USER/SMTP_PASS not set — contact form emails will fail until configured."
  );
}

export async function sendContactMail(opts: { subject: string; text: string; replyTo?: string }) {
  if (!transporter) {
    console.error("[mailer] Email not sent (SMTP not configured):", opts.subject);
    throw new Error("Email delivery is not configured");
  }
  await transporter.sendMail({
    from: MAIL_FROM.includes("<") ? MAIL_FROM : `"Gama Express Website" <${MAIL_FROM}>`,
    to: MAIL_TO,
    replyTo: opts.replyTo,
    subject: opts.subject,
    text: opts.text,
  });
}
