import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  parseImportRow,
  generateUsername,
  generateTempPassword,
  normalizeName,
} from "@/lib/import-columns";

type ResultRow = {
  codigo: string;
  nombre: string;
  username?: string;
  tempPassword?: string;
  status: "creado" | "actualizado" | "error";
  error?: string;
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Sube un archivo Excel o CSV." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const results: ResultRow[] = [];
  const codigoToUserId = new Map<string, string>();

  // Some templates fill JefeCodigo with the manager's full name instead of their code.
  const nameToCodigo = new Map<string, string>();
  for (const raw of rows) {
    const row = parseImportRow(raw);
    if (row.codigo && row.nombre) nameToCodigo.set(normalizeName(row.nombre), row.codigo);
  }
  function resolveJefeCodigo(jefeCodigo: string): string {
    return nameToCodigo.get(normalizeName(jefeCodigo)) ?? jefeCodigo;
  }

  for (const raw of rows) {
    const row = parseImportRow(raw);
    if (!row.codigo || !row.nombre) {
      results.push({
        codigo: row.codigo,
        nombre: row.nombre,
        status: "error",
        error: "Falta Código o Nombre.",
      });
      continue;
    }

    try {
      const existing = await prisma.user.findUnique({
        where: { employeeCode: row.codigo },
      });

      if (existing) {
        const updated = await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: row.nombre,
            email: row.correo,
            curp: row.curp,
            area: row.area,
            departamento: row.departamento,
            puesto: row.puesto,
            telefono: row.telefono,
            category: row.categoria,
            vacationDaysAssigned: row.diasAsignados,
            hireDate: row.hireDate,
            // Solo pisa el cumpleaños si el Excel trae dato; si va vacío se
            // conserva el que la persona haya capturado en Mi Perfil.
            ...(row.birthDate ? { birthDate: row.birthDate } : {}),
            ...(row.empresa ? { empresa: row.empresa } : {}),
            isHR: row.esRRHH,
          },
        });
        codigoToUserId.set(row.codigo, updated.id);
        results.push({
          codigo: row.codigo,
          nombre: row.nombre,
          username: updated.username,
          status: "actualizado",
        });
      } else {
        const username = generateUsername(row.codigo, row.correo);
        const tempPassword = generateTempPassword();
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const created = await prisma.user.create({
          data: {
            employeeCode: row.codigo,
            name: row.nombre,
            email: row.correo,
            curp: row.curp,
            username,
            passwordHash,
            mustChangePassword: true,
            isHR: row.esRRHH,
            area: row.area,
            departamento: row.departamento,
            puesto: row.puesto,
            telefono: row.telefono,
            category: row.categoria,
            vacationDaysAssigned: row.diasAsignados,
            hireDate: row.hireDate,
            birthDate: row.birthDate,
            empresa: row.empresa,
          },
        });
        codigoToUserId.set(row.codigo, created.id);
        results.push({
          codigo: row.codigo,
          nombre: row.nombre,
          username,
          tempPassword,
          status: "creado",
        });
      }
    } catch (err) {
      results.push({
        codigo: row.codigo,
        nombre: row.nombre,
        status: "error",
        error: err instanceof Error ? err.message : "Error desconocido.",
      });
    }
  }

  // Second pass: assign managers now that every employeeCode has a user id.
  for (const raw of rows) {
    const row = parseImportRow(raw);
    if (!row.codigo || !row.jefeCodigo) continue;

    const userId = codigoToUserId.get(row.codigo);
    if (!userId) continue;

    const jefeCodigo = resolveJefeCodigo(row.jefeCodigo);
    let managerId = codigoToUserId.get(jefeCodigo);
    if (!managerId) {
      const manager = await prisma.user.findUnique({
        where: { employeeCode: jefeCodigo },
      });
      managerId = manager?.id;
    }

    if (managerId) {
      await prisma.user.update({ where: { id: userId }, data: { managerId } });
    } else {
      const result = results.find((r) => r.codigo === row.codigo);
      if (result) result.error = `Jefe "${row.jefeCodigo}" no encontrado (ni como código ni como nombre).`;
    }
  }

  return NextResponse.json({ results });
}
