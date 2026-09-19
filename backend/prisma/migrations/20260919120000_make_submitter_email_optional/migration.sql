-- Sell-a-part submissions no longer require an email address from the seller.
ALTER TABLE "ProductSubmission" ALTER COLUMN "submitterEmail" DROP NOT NULL;
