-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'STANDBY', 'COMPLETED');

-- Convert existing string column to enum
-- 1. Rename the old column
ALTER TABLE "Account" RENAME COLUMN "status" TO "status_old";

-- 2. Add the new enum column with default
ALTER TABLE "Account" ADD COLUMN "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';

-- 3. Migrate data: map old string values to enum
UPDATE "Account" SET "status" = 'ACTIVE' WHERE "status_old" = 'active' OR "status_old" IS NULL;

-- 4. Drop the old column
ALTER TABLE "Account" DROP COLUMN "status_old";
