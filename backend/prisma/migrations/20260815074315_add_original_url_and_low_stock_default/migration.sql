-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "lowStockThreshold" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "originalUrl" TEXT;

