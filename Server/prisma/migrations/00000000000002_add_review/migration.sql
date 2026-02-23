-- Enable UUID generator (required for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE "reveiw"
ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;