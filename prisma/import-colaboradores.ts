/**
 * prisma/import-colaboradores.ts
 *
 * Importación en 2 fases con resolución de Puesto / Posición y Jerarquía:
 *  Fase 1 – crea/actualiza todos los User incluyendo su puesto oficial.
 *  Fase 2 – resuelve jerarquías (JefeNombre → managerId).
 *
 * Uso:
 *   npx tsx prisma/import-colaboradores.ts
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";
import { prisma } from "../src/lib/prisma";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Convierte número de serie Excel a Date. */
function excelDateToDate(serial: number | string): Date | null {
  if (!serial) return null;
  if (typeof serial === "string") {
    const parsed = new Date(serial);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  const utcDays = Math.floor(serial) - 25569;
  return new Date(utcDays * 86400 * 1000);
}

/** Genera username desde el nombre completo: "Juan García López" → "juan.garcia" */
function buildUsername(name: string): string {
  const parts = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim()
    .split(/\s+/);

  if (parts.length >= 2) return `${parts[0]}.${parts[1]}`;
  return parts[0] || "usuario";
}

/** Hace el username único añadiendo sufijo numérico si ya existe en el mapa. */
function uniqueUsername(base: string, taken: Set<string>): string {
  let u = base;
  let n = 2;
  while (taken.has(u)) u = `${base}${n++}`;
  taken.add(u);
  return u;
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  const file2Path = path.resolve(__dirname, "../Plantilla_Importacion_Colaboradores_BIA 2.xlsx");
  const file1Path = path.resolve(__dirname, "../Plantilla_Importacion_Colaboradores_BIA.xlsx");

  const filePath = fs.existsSync(file2Path) ? file2Path : file1Path;
  console.log("📂 Leyendo plantilla:", filePath);

  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // Fila 0 = headers, filas 1+ = datos
  const rows = raw.slice(1).filter((r) => r[0]);
  console.log(`📋 Total de filas a procesar: ${rows.length}`);

  // ── Fase 1: crear / actualizar usuarios ──────────────────────────────────
  console.log("\n🚀 FASE 1 — Actualizando colaboradores y puestos...");

  const DEFAULT_PASSWORD = "BIA2024!";
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const nameToId = new Map<string, string>();
  const takenUsernames = new Set<string>();

  const existing = await prisma.user.findMany({ select: { username: true } });
  existing.forEach((u) => takenUsernames.add(u.username));

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const row of rows) {
    const [
      codigoRaw,
      nombre,
      correo,
      curp,
      , // jefeNombre — se usa en fase 2
      area,
      departamento,
      categoria,
      diasAsignados,
      fechaIngresoRaw,
      esRRHH,
      puestoRaw,
    ] = row as [
      number | string,
      string,
      string | null,
      string | null,
      string | null,
      string | null,
      string | null,
      string | null,
      number | null,
      number | string | null,
      string | null,
      string | null,
    ];

    if (!nombre) continue;

    const employeeCode = String(codigoRaw).trim();
    const isHR = String(esRRHH ?? "").trim().toUpperCase() === "SI";
    const hireDate = excelDateToDate(fechaIngresoRaw as number | string);
    const email = correo ? String(correo).trim() : undefined;
    const normalizedName = String(nombre).trim().toUpperCase();
    const puesto = puestoRaw ? String(puestoRaw).trim() : (departamento ? String(departamento).trim() : undefined);

    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { employeeCode },
            ...(email ? [{ email }] : []),
          ],
        },
      });

      let userId: string;

      if (existingUser) {
        const updated_ = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: String(nombre).trim(),
            employeeCode,
            ...(email ? { email } : {}),
            curp: curp ? String(curp).trim() : undefined,
            area: area ? String(area).trim() : undefined,
            departamento: departamento ? String(departamento).trim() : undefined,
            puesto: puesto ?? undefined,
            category: categoria ? String(categoria).trim().toUpperCase() : "ADMINISTRATIVO",
            vacationDaysAssigned: diasAsignados ? Number(diasAsignados) : 0,
            earlyFridayDays: 6,
            halfDayDays: 6,
            hireDate: hireDate ?? undefined,
            isHR,
            activo: true,
          },
        });
        userId = updated_.id;
        updated++;
      } else {
        const usernameBase = buildUsername(String(nombre).trim());
        const username = uniqueUsername(usernameBase, takenUsernames);

        const created_ = await prisma.user.create({
          data: {
            employeeCode,
            name: String(nombre).trim(),
            username,
            passwordHash,
            mustChangePassword: true,
            isHR,
            ...(email ? { email } : {}),
            curp: curp ? String(curp).trim() : undefined,
            area: area ? String(area).trim() : undefined,
            departamento: departamento ? String(departamento).trim() : undefined,
            puesto: puesto ?? undefined,
            category: categoria ? String(categoria).trim().toUpperCase() : "ADMINISTRATIVO",
            vacationDaysAssigned: diasAsignados ? Number(diasAsignados) : 0,
            earlyFridayDays: 6,
            halfDayDays: 6,
            hireDate: hireDate ?? undefined,
            empresa: "SANBIA",
            activo: true,
          },
        });
        userId = created_.id;
        created++;
      }

      nameToId.set(normalizedName, userId);
    } catch (err) {
      console.error(`  ❌ Error en "${nombre}":`, err);
      errors++;
    }
  }

  console.log(`  ✅ Creados: ${created} | Actualizados: ${updated} | Errores: ${errors}`);

  // ── Fase 2: asignar managerId ─────────────────────────────────────────────
  console.log("\n🔗 FASE 2 — Asignando jerarquía (managerId)...");

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, employeeCode: true },
  });
  const allNameToId = new Map<string, string>();
  allUsers.forEach((u) => {
    allNameToId.set(u.name.trim().toUpperCase(), u.id);
    if (u.employeeCode) allNameToId.set(u.employeeCode, u.id);
  });

  let assigned = 0;
  let unresolved = 0;

  for (const row of rows) {
    const [codigoRaw, , , , jefeNombre] = row as [
      number | string,
      string,
      string | null,
      string | null,
      string | null,
    ];

    if (!jefeNombre) continue;

    const employeeCode = String(codigoRaw).trim();
    const jefeName = String(jefeNombre).trim().toUpperCase();

    const userId = allNameToId.get(employeeCode) ?? nameToId.get(employeeCode);
    const managerId = allNameToId.get(jefeName);

    if (!userId || !managerId) {
      if (!managerId) unresolved++;
      continue;
    }

    if (userId === managerId) continue;

    await prisma.user.update({
      where: { id: userId },
      data: { managerId },
    });
    assigned++;
  }

  console.log(`  ✅ Jerarquías asignadas: ${assigned} | Sin resolver: ${unresolved}`);
  console.log("\n🎉 Proceso de importación y actualización de puestos completado.");
}

main()
  .catch((e) => {
    console.error("Error fatal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
