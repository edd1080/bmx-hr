-- CreateTable
CREATE TABLE "Beneficio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'BENEFICIO',
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "imageData" TEXT,
    "enlace" TEXT,
    "vigencia" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Beneficio_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
