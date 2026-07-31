-- AlterTable
ALTER TABLE "User" ADD COLUMN "puesto" TEXT;

-- CreateTable
CREATE TABLE "Meta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ciclo" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "peso" INTEGER NOT NULL,
    "naturaleza" TEXT NOT NULL,
    "memoriaCalculo" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valor" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "alcanceParcial" BOOLEAN NOT NULL DEFAULT false,
    "fuente" TEXT NOT NULL,
    "fechaInicio" DATETIME NOT NULL,
    "fechaFin" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "managerId" TEXT,
    "managerComment" TEXT,
    "lockedAt" DATETIME,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Meta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Meta_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
