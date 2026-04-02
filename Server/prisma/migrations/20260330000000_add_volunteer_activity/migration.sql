-- CreateTable
CREATE TABLE "volunteer_activities" (
    "id" TEXT NOT NULL,
    "volunteer_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT NOT NULL,
    "helped_campaign" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volunteer_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "volunteer_activities_volunteer_id_idx" ON "volunteer_activities"("volunteer_id");

-- AddForeignKey
ALTER TABLE "volunteer_activities" ADD CONSTRAINT "volunteer_activities_volunteer_id_fkey"
    FOREIGN KEY ("volunteer_id") REFERENCES "volunteers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
