-- AlterTable
ALTER TABLE "Course" ADD COLUMN "vigenciaMeses" INTEGER;

-- CreateTable
CREATE TABLE "Ruta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "puesto" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RutaCurso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rutaId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RutaCurso_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "Ruta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RutaCurso_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RutaCurso_rutaId_courseId_key" ON "RutaCurso"("rutaId", "courseId");
