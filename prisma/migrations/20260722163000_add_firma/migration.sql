-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'POLITICA',
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "archivoData" TEXT,
    "archivoNombre" TEXT,
    "alcance" TEXT NOT NULL DEFAULT 'TODOS',
    "area" TEXT,
    "vigencia" TEXT,
    "cerrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Documento_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentoDestinatario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "DocumentoDestinatario_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "Documento" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DocumentoDestinatario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Firma" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nombreFirma" TEXT NOT NULL,
    "hashDoc" TEXT NOT NULL,
    "ipHint" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Firma_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "Documento" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Firma_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentoDestinatario_documentoId_userId_key" ON "DocumentoDestinatario"("documentoId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Firma_documentoId_userId_key" ON "Firma"("documentoId", "userId");
