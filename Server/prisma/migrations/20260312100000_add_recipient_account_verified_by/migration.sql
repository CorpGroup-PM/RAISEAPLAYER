-- AlterTable: add verifiedById and verifiedAt to RecipientAccount for admin accountability
ALTER TABLE "RecipientAccount"
  ADD COLUMN "verified_by_id" TEXT,
  ADD COLUMN "verified_at"    TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "RecipientAccount"
  ADD CONSTRAINT "RecipientAccount_verified_by_id_fkey"
  FOREIGN KEY ("verified_by_id")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
