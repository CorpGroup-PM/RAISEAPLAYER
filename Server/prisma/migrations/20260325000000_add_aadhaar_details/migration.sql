-- CreateTable
CREATE TABLE "AadhaarDetails" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aadhaarNumber" TEXT,
    "frontPdfKey" TEXT,
    "backPdfKey" TEXT,
    "isAadhaarVerified" BOOLEAN NOT NULL DEFAULT false,
    "aadhaarVerifiedById" TEXT,
    "aadhaarVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "AadhaarDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AadhaarDetails_userId_key" ON "AadhaarDetails"("userId");

-- AddForeignKey
ALTER TABLE "AadhaarDetails" ADD CONSTRAINT "AadhaarDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
