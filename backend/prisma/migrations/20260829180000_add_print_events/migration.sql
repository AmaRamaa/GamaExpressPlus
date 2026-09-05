-- CreateEnum
CREATE TYPE "PrintEventStatus" AS ENUM ('PRINTED', 'FAILED');

-- CreateTable
CREATE TABLE "PrintEvent" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "sku" TEXT,
    "externalJobId" TEXT NOT NULL,
    "status" "PrintEventStatus" NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrintEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrintEvent_externalJobId_key" ON "PrintEvent"("externalJobId");

-- CreateIndex
CREATE INDEX "PrintEvent_productId_idx" ON "PrintEvent"("productId");

-- AddForeignKey
ALTER TABLE "PrintEvent" ADD CONSTRAINT "PrintEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
