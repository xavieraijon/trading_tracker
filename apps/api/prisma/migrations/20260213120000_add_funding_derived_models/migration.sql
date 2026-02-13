-- CreateEnum
CREATE TYPE "OperationalState" AS ENUM ('BREAK_EVEN', 'DRAWDOWN', 'PROFIT', 'PAYOUT_REQUESTED', 'PAYOUT_PROCESSING', 'CHALLENGE');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "PayoutRequestStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'PAID');

-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('NFP', 'HOLIDAY', 'WEEKEND', 'CUSTOM');

-- CreateTable
CREATE TABLE "AccountCycle" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "cycleStartBalance" DECIMAL(18,2) NOT NULL,
    "profitTargetPct" DECIMAL(5,2) NOT NULL DEFAULT 2,
    "status" "CycleStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "AccountCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAccountStatus" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "operationalState" "OperationalState" NOT NULL,
    "balanceEod" DECIMAL(18,2) NOT NULL,
    "pnlDay" DECIMAL(18,2) NOT NULL,
    "tradesCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],

    CONSTRAINT "DailyAccountStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountStateSnapshot" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "currentCycleId" TEXT,
    "operationalState" "OperationalState" NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL,
    "cycleStartBalance" DECIMAL(18,2) NOT NULL,
    "drawdownPct" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "profitPct" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "daysToPayoutEligible" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountStateSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutRequest" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eligibleDate" DATE NOT NULL,
    "paidAt" DATE,
    "amount" DECIMAL(18,2),
    "status" "PayoutRequestStatus" NOT NULL DEFAULT 'REQUESTED',

    CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "CalendarEventType" NOT NULL,
    "label" TEXT NOT NULL,
    "blocksTrading" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyAccountStatus_accountId_date_key" ON "DailyAccountStatus"("accountId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AccountStateSnapshot_accountId_key" ON "AccountStateSnapshot"("accountId");

-- CreateIndex
CREATE INDEX "AccountCycle_accountId_startDate_idx" ON "AccountCycle"("accountId", "startDate");

-- CreateIndex
CREATE INDEX "AccountCycle_accountId_status_idx" ON "AccountCycle"("accountId", "status");

-- CreateIndex
CREATE INDEX "DailyAccountStatus_cycleId_date_idx" ON "DailyAccountStatus"("cycleId", "date");

-- CreateIndex
CREATE INDEX "DailyAccountStatus_accountId_date_idx" ON "DailyAccountStatus"("accountId", "date");

-- CreateIndex
CREATE INDEX "PayoutRequest_accountId_cycleId_idx" ON "PayoutRequest"("accountId", "cycleId");

-- CreateIndex
CREATE INDEX "PayoutRequest_status_idx" ON "PayoutRequest"("status");

-- CreateIndex
CREATE INDEX "CalendarEvent_date_idx" ON "CalendarEvent"("date");

-- AddForeignKey
ALTER TABLE "AccountCycle" ADD CONSTRAINT "AccountCycle_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAccountStatus" ADD CONSTRAINT "DailyAccountStatus_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAccountStatus" ADD CONSTRAINT "DailyAccountStatus_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AccountCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountStateSnapshot" ADD CONSTRAINT "AccountStateSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountStateSnapshot" ADD CONSTRAINT "AccountStateSnapshot_currentCycleId_fkey" FOREIGN KEY ("currentCycleId") REFERENCES "AccountCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AccountCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
