-- AddColumn isPanVerified, panVerifiedById, panVerifiedAt to PanDetails
ALTER TABLE "PanDetails" ADD COLUMN "isPanVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PanDetails" ADD COLUMN "panVerifiedById" TEXT;
ALTER TABLE "PanDetails" ADD COLUMN "panVerifiedAt" TIMESTAMP(3);
