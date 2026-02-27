-- =============================================================================
-- FIX: Missing columns on existing tables + ensure new tables exist
-- Fully idempotent — safe to run on any DB state.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Ensure required enums exist (in case catch-up migration missed them)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "TransferStatus" AS ENUM (
    'PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RecipientType" AS ENUM ('SELF', 'PARENT_GUARDIAN', 'COACH', 'ACADEMY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

ALTER TYPE "CampaignStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';

-- ---------------------------------------------------------------------------
-- 1. donations: add columns that may be missing
-- ---------------------------------------------------------------------------
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "guestName"          TEXT;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "guestEmail"         TEXT;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "guestMobile"        TEXT;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "donationAmount"     DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "platformTipAmount"  DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "totalAmount"        DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "isAnonymous"        BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "message"            TEXT;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "currency"           TEXT NOT NULL DEFAULT 'INR';

-- ---------------------------------------------------------------------------
-- 2. payouts: add snapshot columns — wrapped in a check so we skip entirely
--    if the table doesn't exist yet (it will be created by migration 3 below)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payouts'
  ) THEN
    ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "accountHolderName"   TEXT NOT NULL DEFAULT '';
    ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "maskedAccountNumber" TEXT NOT NULL DEFAULT '';
    ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "transferredToLabel"  TEXT NOT NULL DEFAULT '';
    ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "bankName"            TEXT;
    ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "ifscCode"            TEXT;
    ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "transactionId"       TEXT NOT NULL DEFAULT '';
    ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "proofImageUrl"       TEXT;
    ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "notes"               TEXT;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. payouts table: create if it doesn't exist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "payouts" (
  "id"                  TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "fundraiser_id"       TEXT          NOT NULL,
  "amount"              DECIMAL(15,2) NOT NULL,
  "currency"            TEXT          NOT NULL DEFAULT 'INR',
  "accountHolderName"   TEXT          NOT NULL DEFAULT '',
  "maskedAccountNumber" TEXT          NOT NULL DEFAULT '',
  "transferredToLabel"  TEXT          NOT NULL DEFAULT '',
  "bankName"            TEXT,
  "ifscCode"            TEXT,
  "transactionId"       TEXT          NOT NULL DEFAULT '',
  "payment_date"        TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "proofImageUrl"       TEXT,
  "notes"               TEXT,
  "processed_by_id"     TEXT          NOT NULL,
  "created_at"          TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "payouts"
    ADD CONSTRAINT "payouts_fundraiser_id_fkey"
    FOREIGN KEY ("fundraiser_id") REFERENCES "Fundraiser"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "payouts"
    ADD CONSTRAINT "payouts_processed_by_id_fkey"
    FOREIGN KEY ("processed_by_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 4. FundTransferRequest: create if it doesn't exist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "FundTransferRequest" (
  "id"              TEXT             NOT NULL DEFAULT gen_random_uuid()::text,
  "createdAt"       TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fundraiserId"    TEXT             NOT NULL,
  "amount"          DECIMAL(12,2)    NOT NULL,
  "currency"        TEXT             NOT NULL DEFAULT 'INR',
  "status"          "TransferStatus" NOT NULL DEFAULT 'PENDING',
  "processedAt"     TIMESTAMP(3),
  "requested_by_id" TEXT             NOT NULL,
  "reviewed_by_id"  TEXT,
  "review_reason"   TEXT,
  "failed_reason"   TEXT,
  "payout_id"       TEXT,
  "idempotency_key" TEXT,
  CONSTRAINT "FundTransferRequest_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "FundTransferRequest"
    ADD CONSTRAINT "FundTransferRequest_payout_id_key" UNIQUE ("payout_id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "FundTransferRequest"
    ADD CONSTRAINT "FundTransferRequest_idempotency_key_key" UNIQUE ("idempotency_key");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "FundTransferRequest_fundraiserId_idx" ON "FundTransferRequest"("fundraiserId");
CREATE INDEX IF NOT EXISTS "FundTransferRequest_status_idx"       ON "FundTransferRequest"("status");

