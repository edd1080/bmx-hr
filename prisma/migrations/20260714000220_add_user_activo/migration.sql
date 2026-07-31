-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeCode" TEXT,
    "curp" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "isHR" BOOLEAN NOT NULL DEFAULT false,
    "area" TEXT,
    "departamento" TEXT,
    "puesto" TEXT,
    "telefono" TEXT,
    "category" TEXT NOT NULL DEFAULT 'ADMINISTRATIVO',
    "vacationDaysAssigned" INTEGER NOT NULL DEFAULT 0,
    "hireDate" DATETIME,
    "birthDate" DATETIME,
    "empresa" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "bajaAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "managerId" TEXT,
    CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("area", "birthDate", "category", "createdAt", "curp", "departamento", "email", "employeeCode", "empresa", "hireDate", "id", "isHR", "managerId", "mustChangePassword", "name", "passwordHash", "puesto", "telefono", "updatedAt", "username", "vacationDaysAssigned") SELECT "area", "birthDate", "category", "createdAt", "curp", "departamento", "email", "employeeCode", "empresa", "hireDate", "id", "isHR", "managerId", "mustChangePassword", "name", "passwordHash", "puesto", "telefono", "updatedAt", "username", "vacationDaysAssigned" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_employeeCode_key" ON "User"("employeeCode");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
