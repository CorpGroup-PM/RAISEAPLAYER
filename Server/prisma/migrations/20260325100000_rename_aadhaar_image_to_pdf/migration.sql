-- Rename Aadhaar image key columns to PDF key columns
ALTER TABLE "AadhaarDetails" RENAME COLUMN "frontImageKey" TO "frontPdfKey";
ALTER TABLE "AadhaarDetails" RENAME COLUMN "backImageKey" TO "backPdfKey";
