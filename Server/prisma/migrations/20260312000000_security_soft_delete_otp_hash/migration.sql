-- AddColumn: soft-delete support for reviews
ALTER TABLE "reveiw" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- DropColumn: remove plaintext OTP (only hashed OTP stored going forward)
ALTER TABLE "email_otp" DROP COLUMN "otp_code";
