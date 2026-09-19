-- AlterTable
ALTER TABLE "ProductSubmission" ADD COLUMN "oemNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ProductSubmission" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "ProductSubmission" ADD COLUMN "brandId" TEXT;

-- CreateIndex
CREATE INDEX "ProductSubmission_categoryId_idx" ON "ProductSubmission"("categoryId");

-- CreateIndex
CREATE INDEX "ProductSubmission_brandId_idx" ON "ProductSubmission"("brandId");

-- AddForeignKey
ALTER TABLE "ProductSubmission" ADD CONSTRAINT "ProductSubmission_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSubmission" ADD CONSTRAINT "ProductSubmission_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
