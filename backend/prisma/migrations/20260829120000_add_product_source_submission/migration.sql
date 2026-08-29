-- AlterTable
ALTER TABLE "Product" ADD COLUMN "sourceSubmissionId" TEXT,
ADD COLUMN "sourceSellerName" TEXT,
ADD COLUMN "sourceSellerEmail" TEXT,
ADD COLUMN "sourceSellerPhone" TEXT;

-- AlterTable
ALTER TABLE "ProductSubmission" DROP COLUMN "promotedProductId";

-- CreateIndex
CREATE UNIQUE INDEX "Product_sourceSubmissionId_key" ON "Product"("sourceSubmissionId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sourceSubmissionId_fkey" FOREIGN KEY ("sourceSubmissionId") REFERENCES "ProductSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
