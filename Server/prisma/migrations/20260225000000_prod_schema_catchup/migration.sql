-- =============================================================================
-- PRODUCTION CATCH-UP MIGRATION
-- Idempotent: safe to run on any DB state (all statements use IF NOT EXISTS).
-- Applies schema additions that may be missing from production:
--   1. refresh_token_updated_at column on users
--   2. COMPLETED value on CampaignStatus enum
--   3. Enum types for newer models (SportsDocumentType, DocumentVerificationStatus,
--      RecipientType, TransferStatus)
--   4. PanDetails table
--   5. FundraiserMedia table
--   6. FundraiserDocument table
--   7. FundraiserBeneficiaryOther table
--   8. FundraiserUpdate table
--   9. RecipientAccount table
--   10. FundTransferRequest table
--   11. FundraiserUpdate index fix (drop UNIQUE if it exists, keep plain index)
--   12. reveiw table
--   13. Missing indexes
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Ensure pgcrypto extension exists
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 2. Users table: add refresh_token_updated_at if missing
-- ---------------------------------------------------------------------------
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "refresh_token_updated_at" TIMESTAMP(3);

-- ---------------------------------------------------------------------------
-- 3. CampaignStatus enum: add COMPLETED if missing
--    (ALTER TYPE ADD VALUE IF NOT EXISTS is safe inside a transaction on PG 12+)
-- ---------------------------------------------------------------------------
ALTER TYPE "CampaignStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';

-- ---------------------------------------------------------------------------
-- 4. Create missing enum types (idempotent via exception block)
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "SportsDocumentType" AS ENUM (
    'ATHLETE_IDENTITY', 'ACADEMY_CONFIRMATION', 'COACH_CONFIRMATION',
    'EQUIPMENT_QUOTE', 'TOURNAMENT_INVITE', 'TRAINING_RECEIPT',
    'SPORTS_FEDERATION_PROOF', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DocumentVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RecipientType" AS ENUM ('SELF', 'PARENT_GUARDIAN', 'COACH', 'ACADEMY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TransferStatus" AS ENUM (
    'PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 5. PanDetails table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PanDetails" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL,
  "panNumber" TEXT,
  "panName"   TEXT,
  "address"   TEXT,
  "city"      TEXT,
  "state"     TEXT,
  "country"   TEXT,
  "pincode"   TEXT,
  CONSTRAINT "PanDetails_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PanDetails_userId_key" UNIQUE ("userId")
);

DO $$ BEGIN
  ALTER TABLE "PanDetails"
    ADD CONSTRAINT "PanDetails_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 6. FundraiserMedia table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "fundraiser_media" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fundraiser_id" TEXT NOT NULL,
  "youTubeUrl"    TEXT[] DEFAULT ARRAY[]::TEXT[],
  "playerImages"  TEXT[] DEFAULT ARRAY[]::TEXT[],
  "sortOrder"     INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "fundraiser_media_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fundraiser_media_fundraiser_id_key" UNIQUE ("fundraiser_id")
);

DO $$ BEGIN
  ALTER TABLE "fundraiser_media"
    ADD CONSTRAINT "fundraiser_media_fundraiser_id_fkey"
    FOREIGN KEY ("fundraiser_id") REFERENCES "Fundraiser"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "fundraiser_media_fundraiser_id_idx"
  ON "fundraiser_media"("fundraiser_id");

-- ---------------------------------------------------------------------------
-- 7. FundraiserDocument table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "FundraiserDocument" (
  "id"                 TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fundraiserId"       TEXT NOT NULL,
  "type"               "SportsDocumentType" NOT NULL,
  "title"              TEXT,
  "fileUrl"            TEXT NOT NULL,
  "mimeType"           TEXT NOT NULL,
  "fileSize"           INTEGER NOT NULL,
  "isPublic"           BOOLEAN NOT NULL DEFAULT false,
  "verificationStatus" "DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
  "verifiedBy"         TEXT,
  "verifiedAt"         TIMESTAMP(3),
  "rejectionReason"    TEXT,
  CONSTRAINT "FundraiserDocument_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "FundraiserDocument"
    ADD CONSTRAINT "FundraiserDocument_fundraiserId_fkey"
    FOREIGN KEY ("fundraiserId") REFERENCES "Fundraiser"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "FundraiserDocument_fundraiserId_idx"
  ON "FundraiserDocument"("fundraiserId");

-- ---------------------------------------------------------------------------
-- 8. FundraiserBeneficiaryOther table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "FundraiserBeneficiaryOther" (
  "id"                     TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fullName"               TEXT NOT NULL,
  "age"                    INTEGER,
  "relationshipToCreator"  TEXT NOT NULL,
  "phoneNumber"            TEXT,
  "email"                  TEXT,
  "fundraiserId"           TEXT NOT NULL,
  CONSTRAINT "FundraiserBeneficiaryOther_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FundraiserBeneficiaryOther_fundraiserId_key" UNIQUE ("fundraiserId")
);

DO $$ BEGIN
  ALTER TABLE "FundraiserBeneficiaryOther"
    ADD CONSTRAINT "FundraiserBeneficiaryOther_fundraiserId_fkey"
    FOREIGN KEY ("fundraiserId") REFERENCES "Fundraiser"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 9. FundraiserUpdate table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "FundraiserUpdate" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "UpdateAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fundraiserId" TEXT NOT NULL,
  "title"        TEXT,
  "content"      TEXT NOT NULL,
  CONSTRAINT "FundraiserUpdate_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "FundraiserUpdate"
    ADD CONSTRAINT "FundraiserUpdate_fundraiserId_fkey"
    FOREIGN KEY ("fundraiserId") REFERENCES "Fundraiser"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 10. RecipientAccount table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "RecipientAccount" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fundraiserId"  TEXT NOT NULL,
  "recipientType" "RecipientType" NOT NULL,
  "firstName"     TEXT NOT NULL,
  "lastName"      TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "bankName"      TEXT NOT NULL,
  "country"       TEXT NOT NULL,
  "ifscCode"      TEXT,
  "isVerified"    BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "RecipientAccount_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RecipientAccount_fundraiserId_key" UNIQUE ("fundraiserId")
);

DO $$ BEGIN
  ALTER TABLE "RecipientAccount"
    ADD CONSTRAINT "RecipientAccount_fundraiserId_fkey"
    FOREIGN KEY ("fundraiserId") REFERENCES "Fundraiser"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "RecipientAccount_fundraiserId_idx"
  ON "RecipientAccount"("fundraiserId");

-- ---------------------------------------------------------------------------
-- 11. FundTransferRequest table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "FundTransferRequest" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fundraiserId"    TEXT NOT NULL,
  "amount"          DECIMAL(12,2) NOT NULL,
  "currency"        TEXT NOT NULL DEFAULT 'INR',
  "status"          "TransferStatus" NOT NULL DEFAULT 'PENDING',
  "processedAt"     TIMESTAMP(3),
  "requested_by_id" TEXT NOT NULL,
  "reviewed_by_id"  TEXT,
  "review_reason"   TEXT,
  "failed_reason"   TEXT,
  "payout_id"       TEXT,
  "idempotency_key" TEXT,
  CONSTRAINT "FundTransferRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FundTransferRequest_payout_id_key" UNIQUE ("payout_id"),
  CONSTRAINT "FundTransferRequest_idempotency_key_key" UNIQUE ("idempotency_key")
);

DO $$ BEGIN
  ALTER TABLE "FundTransferRequest"
    ADD CONSTRAINT "FundTransferRequest_fundraiserId_fkey"
    FOREIGN KEY ("fundraiserId") REFERENCES "Fundraiser"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "FundTransferRequest"
    ADD CONSTRAINT "FundTransferRequest_requested_by_id_fkey"
    FOREIGN KEY ("requested_by_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "FundTransferRequest"
    ADD CONSTRAINT "FundTransferRequest_reviewed_by_id_fkey"
    FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "FundTransferRequest"
    ADD CONSTRAINT "FundTransferRequest_payout_id_fkey"
    FOREIGN KEY ("payout_id") REFERENCES "payouts"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "FundTransferRequest_fundraiserId_idx"
  ON "FundTransferRequest"("fundraiserId");

CREATE INDEX IF NOT EXISTS "FundTransferRequest_status_idx"
  ON "FundTransferRequest"("status");

-- ---------------------------------------------------------------------------
-- 12. FundraiserUpdate: drop UNIQUE on fundraiserId if it still exists
--     (was changed to a plain index in a prior migration)
--     Catches both undefined_object (constraint missing) and
--     undefined_table (table was just created above with no such constraint).
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  ALTER TABLE "FundraiserUpdate" DROP CONSTRAINT "FundraiserUpdate_fundraiserId_key";
EXCEPTION WHEN undefined_object OR undefined_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "FundraiserUpdate_fundraiserId_idx"
  ON "FundraiserUpdate"("fundraiserId");

-- ---------------------------------------------------------------------------
-- 13. reveiw table (typo preserved to match @@map("reveiw") in schema)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "reveiw" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"       TEXT NOT NULL,
  "rating"     INTEGER NOT NULL,
  "message"    TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "reveiw_pkey" PRIMARY KEY ("id")
);
