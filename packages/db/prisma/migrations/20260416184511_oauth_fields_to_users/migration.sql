-- AlterTable
ALTER TABLE "users" ADD COLUMN     "image" TEXT,
ADD COLUMN     "provider" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL,
ALTER COLUMN "name" DROP NOT NULL;
