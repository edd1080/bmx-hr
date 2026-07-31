-- CreateTable
CREATE TABLE "MetaAvance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metaId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "avancePct" INTEGER NOT NULL,
    "comentario" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MetaAvance_metaId_fkey" FOREIGN KEY ("metaId") REFERENCES "Meta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MetaAvance_metaId_mes_key" ON "MetaAvance"("metaId", "mes");
