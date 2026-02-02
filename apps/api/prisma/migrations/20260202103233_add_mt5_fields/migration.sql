-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "commission" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "swap" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Trade_externalId_idx" ON "Trade"("externalId");
