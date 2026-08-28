-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'REJECTED', 'APPROVED', 'PROMOTED');

-- CreateTable
CREATE TABLE "ProductSubmission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitterName" TEXT NOT NULL,
    "submitterEmail" TEXT NOT NULL,
    "submitterPhone" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "images" TEXT[],
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "aiIsCarPart" BOOLEAN,
    "aiReasoning" TEXT,
    "promotedProductId" TEXT,

    CONSTRAINT "ProductSubmission_pkey" PRIMARY KEY ("id")
);
