-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_agencyId_fkey";

-- AlterTable
ALTER TABLE "Role" ALTER COLUMN "agencyId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
