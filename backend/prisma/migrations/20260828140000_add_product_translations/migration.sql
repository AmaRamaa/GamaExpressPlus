-- AlterTable
ALTER TABLE "Product" ADD COLUMN "contentLanguage" "Language",
ADD COLUMN "titleTranslated" TEXT,
ADD COLUMN "shortDescriptionTranslated" TEXT,
ADD COLUMN "descriptionTranslated" TEXT;
