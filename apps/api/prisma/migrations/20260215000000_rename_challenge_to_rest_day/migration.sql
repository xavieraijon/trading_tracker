-- AlterEnum: rename CHALLENGE → REST_DAY in OperationalState
ALTER TYPE "OperationalState" RENAME VALUE 'CHALLENGE' TO 'REST_DAY';
