-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "imageData" TEXT,
    "lugar" TEXT,
    "inicio" DATETIME NOT NULL,
    "fin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evento_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventoRSVP" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EventoRSVP_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventoRSVP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Encuesta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "pregunta" TEXT NOT NULL,
    "cerrada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Encuesta_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EncuestaOpcion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "encuestaId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "EncuestaOpcion_encuestaId_fkey" FOREIGN KEY ("encuestaId") REFERENCES "Encuesta" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EncuestaVoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "encuestaId" TEXT NOT NULL,
    "opcionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EncuestaVoto_encuestaId_fkey" FOREIGN KEY ("encuestaId") REFERENCES "Encuesta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EncuestaVoto_opcionId_fkey" FOREIGN KEY ("opcionId") REFERENCES "EncuestaOpcion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EncuestaVoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reconocimiento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deId" TEXT NOT NULL,
    "paraId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'GRACIAS',
    "mensaje" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reconocimiento_deId_fkey" FOREIGN KEY ("deId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reconocimiento_paraId_fkey" FOREIGN KEY ("paraId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EventoRSVP_eventoId_userId_key" ON "EventoRSVP"("eventoId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "EncuestaVoto_encuestaId_userId_key" ON "EncuestaVoto"("encuestaId", "userId");
