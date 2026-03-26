-- Rename Aadhaar image key columns to PDF key columns
-- Uses IF EXISTS so this is safe on DBs that were created with the new column names already
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'AadhaarDetails' AND column_name = 'frontImageKey'
  ) THEN
    ALTER TABLE "AadhaarDetails" RENAME COLUMN "frontImageKey" TO "frontPdfKey";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'AadhaarDetails' AND column_name = 'backImageKey'
  ) THEN
    ALTER TABLE "AadhaarDetails" RENAME COLUMN "backImageKey" TO "backPdfKey";
  END IF;
END $$;
