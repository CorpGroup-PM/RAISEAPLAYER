-- =============================================================================
-- RAISE A PLAYER — Consolidated Migration
-- Source of truth: prisma/schema.prisma
-- Incorporates all historical migrations:
--   00000000000000_baseline
--   00000000000001_add_review
--   00000000000002_add_review
--   20251222060556_init
--   20260110_add_refresh_token_updated_at
--   20260110084231_fix_fundraiser_updates_relation
--   20260211xxxx_add_completed_campaign_status
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSION
-- Required for gen_random_uuid() on PostgreSQL < 13. Safe to run on PG 13+.
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');

CREATE TYPE "CampaignFor" AS ENUM ('SELF', 'OTHER');

-- COMPLETED added via 20260211xxxx migration; included here from the start.
CREATE TYPE "CampaignStatus" AS ENUM (
    'PENDING_REVIEW',
    'APPROVED',
    'REJECTED',
    'ACTIVE',
    'SUSPENDED',
    'COMPLETED'
);

CREATE TYPE "PaymentProvider" AS ENUM ('RAZORPAY');

-- REFUNDED value was present in an early draft migration but removed from the
-- final schema. Only PENDING / SUCCESS / FAILED are canonical.
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

CREATE TYPE "OtpType" AS ENUM ('SIGNUP', 'PASSWORD_RESET', 'EMAIL_VERIFY');

CREATE TYPE "DocumentVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

CREATE TYPE "SportsDocumentType" AS ENUM (
    'ATHLETE_IDENTITY',
    'ACADEMY_CONFIRMATION',
    'COACH_CONFIRMATION',
    'EQUIPMENT_QUOTE',
    'TOURNAMENT_INVITE',
    'TRAINING_RECEIPT',
    'SPORTS_FEDERATION_PROOF',
    'OTHER'
);

CREATE TYPE "RecipientType" AS ENUM ('SELF', 'PARENT_GUARDIAN', 'COACH', 'ACADEMY');

CREATE TYPE "TransferStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'PROCESSING',
    'PAID',
    'FAILED',
    'CANCELLED'
);

-- =============================================================================
-- TABLES
-- Creation order respects foreign-key dependencies.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE "users" (
    "id"                         TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
    "first_name"                 TEXT        NOT NULL,
    "last_name"                  TEXT,
    "email"                      TEXT        NOT NULL,
    "phone_number"               TEXT,
    "password_hash"              TEXT,
    "provider"                   "AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "googleId"                   TEXT,
    "role"                       "UserRole"  NOT NULL DEFAULT 'USER',
    "is_email_verified"          BOOLEAN     NOT NULL DEFAULT false,
    "currentHashedRefreshToken"  TEXT,
    -- Added in migration 20260110_add_refresh_token_updated_at
    "refresh_token_updated_at"   TIMESTAMP(3),
    "profile_image_url"          TEXT,
    "created_at"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                 TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- email_otp
-- ---------------------------------------------------------------------------
CREATE TABLE "email_otp" (
    "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
    "email"        TEXT        NOT NULL,
    "otp_code"     TEXT        NOT NULL,
    "otpHash"      TEXT        NOT NULL,
    "type"         "OtpType"   NOT NULL,
    "attemptCount" INTEGER     NOT NULL DEFAULT 0,
    "expires_at"   TIMESTAMP(3) NOT NULL,
    "is_used"      BOOLEAN     NOT NULL DEFAULT false,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId"       TEXT,

    CONSTRAINT "email_otp_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- ResetToken
-- ---------------------------------------------------------------------------
CREATE TABLE "ResetToken" (
    "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
    "email"     TEXT        NOT NULL,
    "token"     TEXT        NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResetToken_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- PanDetails
-- ---------------------------------------------------------------------------
CREATE TABLE "PanDetails" (
    "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId"    TEXT NOT NULL,
    "panNumber" TEXT,
    "panName"   TEXT,
    "address"   TEXT,
    "city"      TEXT,
    "state"     TEXT,
    "country"   TEXT,
    "pincode"   TEXT,

    CONSTRAINT "PanDetails_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- Fundraiser
-- ---------------------------------------------------------------------------
CREATE TABLE "Fundraiser" (
    "id"              TEXT             NOT NULL DEFAULT gen_random_uuid()::text,
    "created_at"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3)     NOT NULL,
    "creator_id"      TEXT             NOT NULL,
    "campaignFor"     "CampaignFor"    NOT NULL,
    "beneficiaryUserId" TEXT,
    "title"           TEXT             NOT NULL,
    "shortDescription" VARCHAR(220)    NOT NULL,
    "story"           TEXT             NOT NULL,
    "sport"           TEXT             NOT NULL,
    "discipline"      TEXT,
    "level"           TEXT,
    "skills"          TEXT[]           NOT NULL DEFAULT '{}',
    "city"            TEXT             NOT NULL,
    "state"           TEXT             NOT NULL,
    "country"         TEXT             NOT NULL DEFAULT 'India',
    "coverImageURL"   TEXT             NOT NULL,
    "status"          "CampaignStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "approvedAt"      TIMESTAMP(3),
    "rejectedAt"      TIMESTAMP(3),
    "rejectionReason" TEXT,
    "goalAmount"      DECIMAL(12,2)    NOT NULL,
    "raisedAmount"    DECIMAL(12,2)    NOT NULL DEFAULT 0,

    CONSTRAINT "Fundraiser_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- FundraiserBeneficiaryOther
-- ---------------------------------------------------------------------------
CREATE TABLE "FundraiserBeneficiaryOther" (
    "id"                    TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fullName"              TEXT NOT NULL,
    "age"                   INTEGER,
    "relationshipToCreator" TEXT NOT NULL,
    "phoneNumber"           TEXT,
    "email"                 TEXT,
    "fundraiserId"          TEXT NOT NULL,

    CONSTRAINT "FundraiserBeneficiaryOther_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- fundraiser_media
-- ---------------------------------------------------------------------------
CREATE TABLE "fundraiser_media" (
    "id"            TEXT     NOT NULL DEFAULT gen_random_uuid()::text,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fundraiser_id" TEXT     NOT NULL,
    "youTubeUrl"    TEXT[]   NOT NULL DEFAULT '{}',
    "playerImages"  TEXT[]   NOT NULL DEFAULT '{}',
    "sortOrder"     INTEGER  NOT NULL DEFAULT 0,

    CONSTRAINT "fundraiser_media_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- FundraiserDocument
-- ---------------------------------------------------------------------------
CREATE TABLE "FundraiserDocument" (
    "id"                 TEXT                         NOT NULL DEFAULT gen_random_uuid()::text,
    "createdAt"          TIMESTAMP(3)                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3)                 NOT NULL,
    "fundraiserId"       TEXT                         NOT NULL,
    "type"               "SportsDocumentType"         NOT NULL,
    "title"              TEXT,
    "fileUrl"            TEXT                         NOT NULL,
    "mimeType"           TEXT                         NOT NULL,
    "fileSize"           INTEGER                      NOT NULL,
    "isPublic"           BOOLEAN                      NOT NULL DEFAULT false,
    "verificationStatus" "DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedBy"         TEXT,
    "verifiedAt"         TIMESTAMP(3),
    "rejectionReason"    TEXT,

    CONSTRAINT "FundraiserDocument_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- FundraiserUpdate
-- Note: fundraiserId is NOT unique — one fundraiser has many updates.
-- The unique index that existed in baseline was dropped in migration
-- 20260110084231_fix_fundraiser_updates_relation.
-- ---------------------------------------------------------------------------
CREATE TABLE "FundraiserUpdate" (
    "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Column name "UpdateAt" matches Prisma field `UpdateAt DateTime @updatedAt`
    "UpdateAt"     TIMESTAMP(3) NOT NULL,
    "fundraiserId" TEXT        NOT NULL,
    "title"        TEXT,
    "content"      TEXT        NOT NULL,

    CONSTRAINT "FundraiserUpdate_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- RecipientAccount
-- ---------------------------------------------------------------------------
CREATE TABLE "RecipientAccount" (
    "id"            TEXT            NOT NULL DEFAULT gen_random_uuid()::text,
    "createdAt"     TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fundraiserId"  TEXT            NOT NULL,
    "recipientType" "RecipientType" NOT NULL,
    "firstName"     TEXT            NOT NULL,
    "lastName"      TEXT            NOT NULL,
    "accountNumber" TEXT            NOT NULL,
    "bankName"      TEXT            NOT NULL,
    "country"       TEXT            NOT NULL,
    "ifscCode"      TEXT,
    "isVerified"    BOOLEAN         NOT NULL DEFAULT false,

    CONSTRAINT "RecipientAccount_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- payouts  (must precede FundTransferRequest due to FK)
-- ---------------------------------------------------------------------------
CREATE TABLE "payouts" (
    "id"                  TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
    "fundraiser_id"       TEXT         NOT NULL,
    "amount"              DECIMAL(15,2) NOT NULL,
    "currency"            TEXT         NOT NULL DEFAULT 'INR',
    -- Snapshot fields captured at payout time
    "accountHolderName"   TEXT         NOT NULL,
    "maskedAccountNumber" TEXT         NOT NULL,
    "transferredToLabel"  TEXT         NOT NULL,
    "bankName"            TEXT,
    "ifscCode"            TEXT,
    "transactionId"       TEXT         NOT NULL,
    "payment_date"        TIMESTAMP(3) NOT NULL,
    "proofImageUrl"       TEXT,
    "notes"               TEXT,
    "processed_by_id"     TEXT         NOT NULL,
    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- FundTransferRequest
-- ---------------------------------------------------------------------------
CREATE TABLE "FundTransferRequest" (
    "id"              TEXT             NOT NULL DEFAULT gen_random_uuid()::text,
    -- Column name is "createdAt" (camelCase) — matches @map("createdAt") in schema
    "createdAt"       TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3)     NOT NULL,
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

-- ---------------------------------------------------------------------------
-- donations
-- ---------------------------------------------------------------------------
CREATE TABLE "donations" (
    "id"               TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
    "fundraiser_id"    TEXT          NOT NULL,
    "donor_id"         TEXT,
    "guestName"        TEXT,
    "guestEmail"       TEXT,
    "guestMobile"      TEXT,
    "donationAmount"   DECIMAL(15,2) NOT NULL,
    "platformTipAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalAmount"      DECIMAL(15,2) NOT NULL,
    "currency"         TEXT          NOT NULL DEFAULT 'INR',
    "isAnonymous"      BOOLEAN       NOT NULL DEFAULT false,
    "message"          TEXT,
    "status"           "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "created_at"       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
CREATE TABLE "payments" (
    "id"                TEXT             NOT NULL DEFAULT gen_random_uuid()::text,
    "donation_id"       TEXT             NOT NULL,
    "provider"          "PaymentProvider" NOT NULL DEFAULT 'RAZORPAY',
    "razorpayOrderId"   TEXT,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "status"            "PaymentStatus"  NOT NULL DEFAULT 'PENDING',
    "rawResponse"       JSONB,
    "created_at"        TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- notification_logs
-- ---------------------------------------------------------------------------
CREATE TABLE "notification_logs" (
    "id"             TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
    "recipientEmail" TEXT        NOT NULL,
    "subject"        TEXT        NOT NULL,
    "type"           TEXT        NOT NULL,
    "sentAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status"         TEXT        NOT NULL,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- admin_activity_logs
-- ---------------------------------------------------------------------------
CREATE TABLE "admin_activity_logs" (
    "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
    "adminId"     TEXT        NOT NULL,
    "action"      TEXT        NOT NULL,
    "targetId"    TEXT        NOT NULL,
    "targetTable" TEXT        NOT NULL,
    "ipAddress"   TEXT,
    "details"     JSONB,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_activity_logs_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- reveiw  (Review model — table name "reveiw" is intentional, matches @@map)
-- Columns added via migrations 00000000000001 and 00000000000002.
-- ---------------------------------------------------------------------------
CREATE TABLE "reveiw" (
    "id"         TEXT     NOT NULL DEFAULT gen_random_uuid()::text,
    "name"       TEXT     NOT NULL,
    "rating"     INTEGER  NOT NULL,
    "message"    TEXT     NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isVerified" BOOLEAN  NOT NULL DEFAULT false,

    CONSTRAINT "reveiw_pkey" PRIMARY KEY ("id")
);

-- =============================================================================
-- UNIQUE INDEXES
-- =============================================================================

CREATE UNIQUE INDEX "users_email_key"       ON "users"("email");
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");
CREATE UNIQUE INDEX "users_googleId_key"    ON "users"("googleId");

CREATE UNIQUE INDEX "email_otp_email_key"   ON "email_otp"("email");

CREATE UNIQUE INDEX "ResetToken_email_key"  ON "ResetToken"("email");
CREATE UNIQUE INDEX "ResetToken_token_key"  ON "ResetToken"("token");

CREATE UNIQUE INDEX "PanDetails_userId_key" ON "PanDetails"("userId");

CREATE UNIQUE INDEX "FundraiserBeneficiaryOther_fundraiserId_key"
    ON "FundraiserBeneficiaryOther"("fundraiserId");

CREATE UNIQUE INDEX "fundraiser_media_fundraiser_id_key"
    ON "fundraiser_media"("fundraiser_id");

CREATE UNIQUE INDEX "RecipientAccount_fundraiserId_key"
    ON "RecipientAccount"("fundraiserId");

CREATE UNIQUE INDEX "FundTransferRequest_payout_id_key"
    ON "FundTransferRequest"("payout_id");

CREATE UNIQUE INDEX "FundTransferRequest_idempotency_key_key"
    ON "FundTransferRequest"("idempotency_key");

CREATE UNIQUE INDEX "payments_donation_id_key"     ON "payments"("donation_id");
CREATE UNIQUE INDEX "payments_razorpayOrderId_key" ON "payments"("razorpayOrderId");

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- email_otp: fast lookup by email + type + used flag
CREATE INDEX "email_otp_email_type_is_used_idx"
    ON "email_otp"("email", "type", "is_used");

-- Fundraiser
CREATE INDEX "Fundraiser_creator_id_idx" ON "Fundraiser"("creator_id");
CREATE INDEX "Fundraiser_status_idx"     ON "Fundraiser"("status");
CREATE INDEX "Fundraiser_sport_idx"      ON "Fundraiser"("sport");

-- fundraiser_media
CREATE INDEX "fundraiser_media_fundraiser_id_idx"
    ON "fundraiser_media"("fundraiser_id");

-- FundraiserDocument
CREATE INDEX "FundraiserDocument_fundraiserId_idx"
    ON "FundraiserDocument"("fundraiserId");

-- FundraiserUpdate (regular index; unique index was intentionally dropped)
CREATE INDEX "FundraiserUpdate_fundraiserId_idx"
    ON "FundraiserUpdate"("fundraiserId");

-- RecipientAccount
CREATE INDEX "RecipientAccount_fundraiserId_idx"
    ON "RecipientAccount"("fundraiserId");

-- FundTransferRequest
CREATE INDEX "FundTransferRequest_fundraiserId_idx"
    ON "FundTransferRequest"("fundraiserId");
CREATE INDEX "FundTransferRequest_status_idx"
    ON "FundTransferRequest"("status");

-- donations
CREATE INDEX "donations_fundraiser_id_idx" ON "donations"("fundraiser_id");
CREATE INDEX "donations_donor_id_idx"      ON "donations"("donor_id");
CREATE INDEX "donations_status_idx"        ON "donations"("status");
CREATE INDEX "donations_created_at_idx"    ON "donations"("created_at");

-- payments
CREATE INDEX "payments_status_idx"     ON "payments"("status");
CREATE INDEX "payments_created_at_idx" ON "payments"("created_at");

-- =============================================================================
-- FOREIGN KEY CONSTRAINTS
-- Ordered so referenced tables always appear before referencing tables.
-- =============================================================================

-- email_otp → users
ALTER TABLE "email_otp"
    ADD CONSTRAINT "email_otp_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- PanDetails → users
ALTER TABLE "PanDetails"
    ADD CONSTRAINT "PanDetails_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Fundraiser → users (campaign creator)
ALTER TABLE "Fundraiser"
    ADD CONSTRAINT "Fundraiser_creator_id_fkey"
    FOREIGN KEY ("creator_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Fundraiser → users (SELF beneficiary)
ALTER TABLE "Fundraiser"
    ADD CONSTRAINT "Fundraiser_beneficiaryUserId_fkey"
    FOREIGN KEY ("beneficiaryUserId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- FundraiserBeneficiaryOther → Fundraiser
ALTER TABLE "FundraiserBeneficiaryOther"
    ADD CONSTRAINT "FundraiserBeneficiaryOther_fundraiserId_fkey"
    FOREIGN KEY ("fundraiserId") REFERENCES "Fundraiser"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- fundraiser_media → Fundraiser
ALTER TABLE "fundraiser_media"
    ADD CONSTRAINT "fundraiser_media_fundraiser_id_fkey"
    FOREIGN KEY ("fundraiser_id") REFERENCES "Fundraiser"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- FundraiserDocument → Fundraiser
ALTER TABLE "FundraiserDocument"
    ADD CONSTRAINT "FundraiserDocument_fundraiserId_fkey"
    FOREIGN KEY ("fundraiserId") REFERENCES "Fundraiser"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- FundraiserUpdate → Fundraiser
ALTER TABLE "FundraiserUpdate"
    ADD CONSTRAINT "FundraiserUpdate_fundraiserId_fkey"
    FOREIGN KEY ("fundraiserId") REFERENCES "Fundraiser"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- RecipientAccount → Fundraiser
ALTER TABLE "RecipientAccount"
    ADD CONSTRAINT "RecipientAccount_fundraiserId_fkey"
    FOREIGN KEY ("fundraiserId") REFERENCES "Fundraiser"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- payouts → Fundraiser
ALTER TABLE "payouts"
    ADD CONSTRAINT "payouts_fundraiser_id_fkey"
    FOREIGN KEY ("fundraiser_id") REFERENCES "Fundraiser"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- payouts → users (admin who processed the payout)
ALTER TABLE "payouts"
    ADD CONSTRAINT "payouts_processed_by_id_fkey"
    FOREIGN KEY ("processed_by_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- FundTransferRequest → Fundraiser
ALTER TABLE "FundTransferRequest"
    ADD CONSTRAINT "FundTransferRequest_fundraiserId_fkey"
    FOREIGN KEY ("fundraiserId") REFERENCES "Fundraiser"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- FundTransferRequest → users (creator of transfer request)
ALTER TABLE "FundTransferRequest"
    ADD CONSTRAINT "FundTransferRequest_requested_by_id_fkey"
    FOREIGN KEY ("requested_by_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- FundTransferRequest → users (admin reviewer)
ALTER TABLE "FundTransferRequest"
    ADD CONSTRAINT "FundTransferRequest_reviewed_by_id_fkey"
    FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- FundTransferRequest → payouts (optional link to payout ledger entry)
ALTER TABLE "FundTransferRequest"
    ADD CONSTRAINT "FundTransferRequest_payout_id_fkey"
    FOREIGN KEY ("payout_id") REFERENCES "payouts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- donations → Fundraiser
ALTER TABLE "donations"
    ADD CONSTRAINT "donations_fundraiser_id_fkey"
    FOREIGN KEY ("fundraiser_id") REFERENCES "Fundraiser"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- donations → users (registered donor; NULL for guest donors)
ALTER TABLE "donations"
    ADD CONSTRAINT "donations_donor_id_fkey"
    FOREIGN KEY ("donor_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- payments → donations
ALTER TABLE "payments"
    ADD CONSTRAINT "payments_donation_id_fkey"
    FOREIGN KEY ("donation_id") REFERENCES "donations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- admin_activity_logs → users
ALTER TABLE "admin_activity_logs"
    ADD CONSTRAINT "admin_activity_logs_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
