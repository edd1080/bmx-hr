/*
  Warnings:

  - You are about to alter the column `days` on the `LeaveRequest` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LeaveRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "days" REAL NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "managerId" TEXT,
    "managerComment" TEXT,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LeaveRequest_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LeaveRequest" ("createdAt", "days", "decidedAt", "endDate", "id", "managerComment", "managerId", "reason", "startDate", "status", "type", "userId") SELECT "createdAt", "days", "decidedAt", "endDate", "id", "managerComment", "managerId", "reason", "startDate", "status", "type", "userId" FROM "LeaveRequest";
DROP TABLE "LeaveRequest";
ALTER TABLE "new_LeaveRequest" RENAME TO "LeaveRequest";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeCode" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "isHR" BOOLEAN NOT NULL DEFAULT false,
    "area" TEXT,
    "category" TEXT NOT NULL DEFAULT 'ADMINISTRATIVO',
    "vacationDaysAssigned" INTEGER NOT NULL DEFAULT 0,
    "hireDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "managerId" TEXT,
    CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("area", "createdAt", "email", "employeeCode", "hireDate", "id", "isHR", "managerId", "mustChangePassword", "name", "passwordHash", "updatedAt", "username", "vacationDaysAssigned") SELECT "area", "createdAt", "email", "employeeCode", "hireDate", "id", "isHR", "managerId", "mustChangePassword", "name", "passwordHash", "updatedAt", "username", "vacationDaysAssigned" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_employeeCode_key" ON "User"("employeeCode");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
