/*
  Warnings:

  - You are about to drop the column `approvedBy` on the `Leave` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Leave` table. All the data in the column will be lost.
  - Added the required column `leaveType` to the `Leave` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Leave" DROP CONSTRAINT "Leave_agencyId_fkey";

-- DropForeignKey
ALTER TABLE "Leave" DROP CONSTRAINT "Leave_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Payroll" DROP CONSTRAINT "Payroll_employeeId_fkey";

-- AlterTable
ALTER TABLE "Leave" DROP COLUMN "approvedBy",
DROP COLUMN "type",
ADD COLUMN     "agencyApprovedAt" TIMESTAMP(3),
ADD COLUMN     "agencyApprovedBy" TEXT,
ADD COLUMN     "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "hrApprovedAt" TIMESTAMP(3),
ADD COLUMN     "hrApprovedBy" TEXT,
ADD COLUMN     "leaveType" TEXT NOT NULL,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "supervisorApprovedAt" TIMESTAMP(3),
ADD COLUMN     "supervisorApprovedBy" TEXT;

-- AlterTable
ALTER TABLE "Payroll" ALTER COLUMN "employeeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
