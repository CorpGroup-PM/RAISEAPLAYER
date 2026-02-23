DROP INDEX "FundraiserUpdate_fundraiserId_key";
CREATE INDEX "FundraiserUpdate_fundraiserId_idx"ON "FundraiserUpdate"("fundraiserId");