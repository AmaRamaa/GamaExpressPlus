import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, requirePrintServiceApiKey } from "../middleware/auth";

const router = Router();

// POST /api/print-events -- called by the Windows print-monitor agent
// running on each office/warehouse PC, not a logged-in user, so it's gated
// by requirePrintServiceApiKey (a static API key) instead of the normal JWT
// auth. Field names mirror the agent's actual JSON payload directly (see
// print-monitor/agent/print_monitor_agent.py in the ops repo) -- there is no
// product/SKU concept here and no failure case (the agent only ever reports
// a job after Windows confirms it printed).
const printEventSchema = z.object({
  job_key: z.string().min(1),
  job_id: z.string().nullable().optional(),
  document_name: z.string().nullable().optional(),
  user_name: z.string().nullable().optional(),
  client_computer: z.string().nullable().optional(),
  printer_name: z.string().nullable().optional(),
  port_name: z.string().nullable().optional(),
  size_bytes: z.number().int().nullable().optional(),
  pages: z.number().int().nullable().optional(),
  printed_at: z.string().nullable().optional(),
  agent_hostname: z.string().min(1),
  agent_ip: z.string().nullable().optional(),
  event_record_id: z.string().nullable().optional(),
  source: z.string().min(1),
  captured_pdf_file: z.string().nullable().optional(),
});

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

router.post("/", requirePrintServiceApiKey, async (req, res) => {
  const parsed = printEventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const body = parsed.data;

  try {
    const event = await prisma.printEvent.create({
      data: {
        jobKey: body.job_key,
        jobId: body.job_id ?? null,
        documentName: body.document_name ?? null,
        userName: body.user_name ?? null,
        clientComputer: body.client_computer ?? null,
        printerName: body.printer_name ?? null,
        portName: body.port_name ?? null,
        sizeBytes: body.size_bytes ?? null,
        pages: body.pages ?? null,
        printedAt: parseDate(body.printed_at),
        agentHostname: body.agent_hostname,
        agentIp: body.agent_ip ?? null,
        eventRecordId: body.event_record_id ?? null,
        source: body.source,
        capturedPdfFile: body.captured_pdf_file ?? null,
      },
    });
    res.status(201).json(event);
  } catch (err: any) {
    // A retried/duplicate delivery for a job we've already recorded -- treat
    // it as a harmless no-op (return the existing row) rather than a 500, so
    // the agent's own retry logic doesn't need special-casing.
    if (err.code === "P2002") {
      const existing = await prisma.printEvent.findUnique({ where: { jobKey: body.job_key } });
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
    }),
    prisma.printEvent.count(),
  ]);

  res.json({ items, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
});

export default router;
