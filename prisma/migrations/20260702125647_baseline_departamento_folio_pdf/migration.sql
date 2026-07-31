-- Baseline: these were previously applied directly to the database outside
-- of migration history. This migration records them so history matches
-- reality; it is marked as already-applied via `prisma migrate resolve`
-- rather than executed, since the columns already exist.
-- AlterTable
ALTER TABLE "User" ADD COLUMN "departamento" TEXT;
-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN "folio" TEXT;
ALTER TABLE "LeaveRequest" ADD COLUMN "pdfGeneratedAt" DATETIME;
-- CreateIndex
CREATE UNIQUE INDEX "LeaveRequest_folio_key" ON "LeaveRequest"("folio");
