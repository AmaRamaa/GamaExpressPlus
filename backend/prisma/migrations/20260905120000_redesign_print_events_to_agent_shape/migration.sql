-- Redesign PrintEvent to match the real Windows print-monitor agent's
-- payload (job_key/document_name/etc.) instead of the speculative
-- product/sku/status shape written before the agent existed. The intake
-- endpoint has never successfully received a real event from the agent
-- (its config pointed at the wrong URL until now), so any existing rows
-- predate the real integration and are discarded rather than migrated.
TRUNCATE TABLE "PrintEvent";

-- DropForeignKey
ALTER TABLE "PrintEvent" DROP CONSTRAINT "PrintEvent_productId_fkey";

-- DropIndex
DROP INDEX "PrintEvent_productId_idx";
DROP INDEX "PrintEvent_externalJobId_key";

-- AlterTable
ALTER TABLE "PrintEvent"
  DROP COLUMN "productId",
  DROP COLUMN "sku",
  DROP COLUMN "externalJobId",
  DROP COLUMN "status",
  DROP COLUMN "message",
  ADD COLUMN "jobKey" TEXT NOT NULL,
  ADD COLUMN "jobId" TEXT,
  ADD COLUMN "documentName" TEXT,
  ADD COLUMN "userName" TEXT,
  ADD COLUMN "clientComputer" TEXT,
  ADD COLUMN "printerName" TEXT,
  ADD COLUMN "portName" TEXT,
  ADD COLUMN "sizeBytes" INTEGER,
  ADD COLUMN "pages" INTEGER,
  ADD COLUMN "printedAt" TIMESTAMP(3),
  ADD COLUMN "agentHostname" TEXT NOT NULL,
  ADD COLUMN "agentIp" TEXT,
  ADD COLUMN "eventRecordId" TEXT,
  ADD COLUMN "source" TEXT NOT NULL,
  ADD COLUMN "capturedPdfFile" TEXT;

-- DropEnum
DROP TYPE "PrintEventStatus";

-- CreateIndex
CREATE UNIQUE INDEX "PrintEvent_jobKey_key" ON "PrintEvent"("jobKey");
CREATE INDEX "PrintEvent_agentHostname_idx" ON "PrintEvent"("agentHostname");
CREATE INDEX "PrintEvent_printedAt_idx" ON "PrintEvent"("printedAt");
