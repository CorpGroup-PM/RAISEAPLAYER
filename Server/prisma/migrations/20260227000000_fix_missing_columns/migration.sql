-- =============================================================================
-- FIX: Missing columns on existing tables + ensure new tables exist
--
-- Root cause: The production `donations` table was created before guest-donor
-- and platform-tip columns were added to the schema. The previous catch-up
-- migration (20260225000000) only created NEW tables — it never patched
-- existing ones. This migration is fully idempotent (IF NOT EXISTS everywhere).
--
-- Fixes:
--   1. donations      — add guestName, guestEmail, guestMobile,
--                        donationAmount, platformTipAmount, totalAmount,
--                        isAnonymous, message  (if missing)
--   2. FundTransferRequest — ensure table exists (re-run CREATE IF NOT EXISTS
--                             in case the previous migration was not applied)
--   3. payouts        — ensure all snapshot columns exist
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. donations: add all columns that may be missing
-- ---------------------------------------------------------------------------

-- Guest donor fields (added when guest-donation feature was shipped)
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "guestName"   TEXT;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "guestEmail"  TEXT;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "guestMobile" TEXT;

-- Split-amount fields (originally the table may have had a single "amount" col)
-- We use DEFAULT 0 so existing rows satisfy the NOT NULL constraint.
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "donationAmount"    DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "platformTipAmount" DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "totalAmount"       DECIMAL(15,2) NOT NULL DEFAULT 0;

-- Anonymous + message fields
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "isAnonymous" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "message"     TEXT;

-- currency (may be missing on older DB)
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'INR';

-- ---------------------------------------------------------------------------
-- 2. FundTransferRequest: create if it was never applied
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "FundTransferRequest" (
  "id"              TEXT             NOT NULL DEFAULT gen_random_uuid()::text,
  -- @map("createdAt") — column name is camelCase to match Prisma @map
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

-- Unique constraints (safe to run even if table already existed correctly)
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

-- Foreign keys
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

-- ---------------------------------------------------------------------------
-- 3. payouts: add snapshot columns that may be missing
-- ---------------------------------------------------------------------------
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "accountHolderName"   TEXT NOT NULL DEFAULT '';
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "maskedAccountNumber" TEXT NOT NULL DEFAULT '';
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "transferredToLabel"  TEXT NOT NULL DEFAULT '';
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "bankName"            TEXT;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "ifscCode"            TEXT;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "transactionId"       TEXT NOT NULL DEFAULT '';
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "proofImageUrl"       TEXT;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "notes"               TEXT;
