CREATE TABLE "sponsor_clicks" (
  "id" TEXT NOT NULL,
  "user_type" TEXT NOT NULL DEFAULT 'GUEST',
  "clicked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sponsor_clicks_pkey" PRIMARY KEY ("id")
);
