-- CreateTable: foundation_donations
CREATE TABLE "foundation_donations" (
    "id" TEXT NOT NULL,
    "donor_id" TEXT,
    "donor_name" TEXT,
    "guest_name" TEXT,
    "guest_email" TEXT,
    "guest_mobile" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foundation_donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: foundation_payments
CREATE TABLE "foundation_payments" (
    "id" TEXT NOT NULL,
    "donation_id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'RAZORPAY',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "rawResponse" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foundation_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "foundation_donations_donor_id_idx" ON "foundation_donations"("donor_id");

-- CreateIndex
CREATE INDEX "foundation_donations_status_idx" ON "foundation_donations"("status");

-- CreateIndex
CREATE INDEX "foundation_donations_created_at_idx" ON "foundation_donations"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "foundation_payments_donation_id_key" ON "foundation_payments"("donation_id");

-- CreateIndex
CREATE INDEX "foundation_payments_status_idx" ON "foundation_payments"("status");

-- AddForeignKey
ALTER TABLE "foundation_donations" ADD CONSTRAINT "foundation_donations_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foundation_payments" ADD CONSTRAINT "foundation_payments_donation_id_fkey" FOREIGN KEY ("donation_id") REFERENCES "foundation_donations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
