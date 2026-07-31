-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Posicion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "departamento" TEXT,
    "subDepartamento" TEXT,
    "nivelLabel" TEXT,
    "headcount" INTEGER NOT NULL DEFAULT 0,
    "titularNombre" TEXT,
    "nivel" INTEGER NOT NULL DEFAULT 0,
    "reportaAId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Posicion_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Direccion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Posicion_reportaAId_fkey" FOREIGN KEY ("reportaAId") REFERENCES "Posicion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Posicion" ("areaId", "createdAt", "departamento", "id", "nivel", "nombre", "reportaAId", "subDepartamento") SELECT "areaId", "createdAt", "departamento", "id", "nivel", "nombre", "reportaAId", "subDepartamento" FROM "Posicion";
DROP TABLE "Posicion";
ALTER TABLE "new_Posicion" RENAME TO "Posicion";
CREATE UNIQUE INDEX "Posicion_nombre_areaId_key" ON "Posicion"("nombre", "areaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
