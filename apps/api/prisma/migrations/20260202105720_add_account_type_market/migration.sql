-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('PERSONAL', 'PROP_FIRM');

-- CreateEnum
CREATE TYPE "MarketType" AS ENUM ('CFD', 'FUTURES', 'SPOT', 'CRYPTO', 'STOCKS');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "market" "MarketType" NOT NULL DEFAULT 'CFD',
ADD COLUMN     "type" "AccountType" NOT NULL DEFAULT 'PERSONAL';
