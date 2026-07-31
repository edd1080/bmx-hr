-- CreateTable
CREATE TABLE "Direccion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#1C3565',
    "gerenteN1Id" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Direccion_gerenteN1Id_fkey" FOREIGN KEY ("gerenteN1Id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Posicion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "departamento" TEXT,
    "subDepartamento" TEXT,
    "nivel" INTEGER NOT NULL DEFAULT 0,
    "reportaAId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Posicion_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Direccion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Posicion_reportaAId_fkey" FOREIGN KEY ("reportaAId") REFERENCES "Posicion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OnboardingConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "posicionId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'none',
    "actualizadoPor" TEXT,
    "actualizadoAt" DATETIME NOT NULL,
    CONSTRAINT "OnboardingConfig_posicionId_fkey" FOREIGN KEY ("posicionId") REFERENCES "Posicion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OnboardingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configId" TEXT NOT NULL,
    "posicionResponsableId" TEXT NOT NULL,
    "objetivo" TEXT,
    "duracionMin" INTEGER NOT NULL DEFAULT 30,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "tipo" TEXT NOT NULL DEFAULT 'obligatoria',
    "material" TEXT,
    "evidencia" TEXT NOT NULL DEFAULT 'ninguna',
    CONSTRAINT "OnboardingSession_configId_fkey" FOREIGN KEY ("configId") REFERENCES "OnboardingConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OnboardingSession_posicionResponsableId_fkey" FOREIGN KEY ("posicionResponsableId") REFERENCES "Posicion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NuevoIngreso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "colaboradorNombre" TEXT NOT NULL,
    "posicionId" TEXT NOT NULL,
    "fechaIngreso" DATETIME NOT NULL,
    "creadoPor" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NuevoIngreso_posicionId_fkey" FOREIGN KEY ("posicionId") REFERENCES "Posicion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlanSesion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "posicionResponsableId" TEXT NOT NULL,
    "responsableId" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "fecha" DATETIME,
    "hora" TEXT,
    "comentarios" TEXT,
    "evidenciaUrl" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'obligatoria',
    "objetivo" TEXT,
    "duracionMin" INTEGER NOT NULL DEFAULT 30,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PlanSesion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "NuevoIngreso" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlanSesion_posicionResponsableId_fkey" FOREIGN KEY ("posicionResponsableId") REFERENCES "Posicion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlanSesion_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Direccion_nombre_key" ON "Direccion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Posicion_nombre_areaId_key" ON "Posicion"("nombre", "areaId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingConfig_posicionId_key" ON "OnboardingConfig"("posicionId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingSession_configId_posicionResponsableId_key" ON "OnboardingSession"("configId", "posicionResponsableId");
