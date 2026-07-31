import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { backupDatabase } from "@/lib/db-backup";
import { generateUsername, generateTempPassword } from "@/lib/import-columns";
import {
  parseWorkbook,
  buildPlan,
  resolveManagerCode,
  type ExistingUser,
  type ParsedRow,
  type SyncFields,
} from "@/lib/import-sync";

const USER_SELECT = {
  id: true,
  employeeCode: true,
  name: true,
  email: true,
  curp: true,
  area: true,
  departamento: true,
  puesto: true,
  telefono: true,
  category: true,
  vacationDaysAssigned: true,
  hireDate: true,
  birthDate: true,
  empresa: true,
  isHR: true,
  managerId: true,
  activo: true,
} as const;

type ResultRow = {
  codigo: string;
  nombre: string;
  username?: string;
  tempPassword?: string;
  status: "creado" | "actualizado" | "reactivado" | "baja" | "error";
  error?: string;
};

// Convierte los campos presentes del Excel a datos de Prisma (solo las llaves
// que venían con dato en el archivo).
function fieldsToData(fields: SyncFields): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const keys: (keyof SyncFields)[] = [
    "email",
    "curp",
    "area",
    "departamento",
    "puesto",
    "telefono",
    "category",
    "vacationDaysAssigned",
    "hireDate",
    "birthDate",
    "empresa",
    "isHR",
  ];
  for (const k of keys) {
    if (k in fields) data[k] = fields[k];
  }
  return data;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const deactivateMissing = formData.get("deactivateMissing") === "true";
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Sube un archivo Excel o CSV." }, { status: 400 });
  }

  let parsed: ParsedRow[];
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    parsed = parseWorkbook(buffer);
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer el archivo. Verifica que sea un Excel o CSV válido." },
      { status: 400 },
    );
  }

  const existing = (await prisma.user.findMany({ select: USER_SELECT })) as ExistingUser[];
  const plan = buildPlan(parsed, existing);

  const byCode = new Map<string, ExistingUser>();
  // resolveManagerCode normaliza el nombre internamente; alimentamos el mapa
  // con los nombres tal cual (la normalización ocurre dentro del helper).
  const nameToCode = new Map<string, string>();
  for (const u of existing) if (u.employeeCode) byCode.set(u.employeeCode, u);
  for (const r of parsed) if (r.codigo && r.nombre) nameToCode.set(r.nombre, r.codigo);

  // Índice rápido de acción por número de fila (según el plan).
  const actionByRow = new Map<number, string>();
  for (const pr of plan.rows) actionByRow.set(pr.rowNumber, pr.action);

  // Precalcular credenciales de las altas ANTES de la transacción (bcrypt es
  // asíncrono y no queremos tener la transacción abierta más de lo necesario).
  const creates = parsed.filter((r) => actionByRow.get(r.rowNumber) === "create");
  const prepared = await Promise.all(
    creates.map(async (r) => {
      const username = generateUsername(r.codigo, r.fields.email ?? null);
      const tempPassword = generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      return { row: r, username, tempPassword, passwordHash };
    }),
  );

  // Respaldo consistente ANTES de tocar nada.
  let backupFile: string;
  try {
    backupFile = await backupDatabase("import");
  } catch (err) {
    return NextResponse.json(
      { error: `No se pudo crear el respaldo previo; no se aplicó nada. ${err instanceof Error ? err.message : ""}` },
      { status: 500 },
    );
  }

  const results: ResultRow[] = [];
  const codigoToUserId = new Map<string, string>();
  for (const u of existing) if (u.employeeCode) codigoToUserId.set(u.employeeCode, u.id);

  let deactivated = 0;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Altas.
      for (const p of prepared) {
        const r = p.row;
        const created = await tx.user.create({
          data: {
            employeeCode: r.codigo,
            name: r.nombre,
            username: p.username,
            passwordHash: p.passwordHash,
            mustChangePassword: true,
            ...fieldsToData(r.fields),
          },
        });
        codigoToUserId.set(r.codigo, created.id);
        results.push({
          codigo: r.codigo,
          nombre: r.nombre,
          username: p.username,
          tempPassword: p.tempPassword,
          status: "creado",
        });
      }

      // 2. Cambios (incluye reactivaciones).
      for (const r of parsed) {
        if (actionByRow.get(r.rowNumber) !== "update") continue;
        const current = byCode.get(r.codigo);
        const wasInactive = current ? !current.activo : false;
        await tx.user.update({
          where: { employeeCode: r.codigo },
          data: {
            name: r.nombre,
            ...fieldsToData(r.fields),
            // Presente en el padrón ⇒ activo. Reactiva si estaba de baja.
            activo: true,
            bajaAt: null,
          },
        });
        results.push({
          codigo: r.codigo,
          nombre: r.nombre,
          status: wasInactive ? "reactivado" : "actualizado",
        });
      }

      // 3. Enlace de jefes (segunda pasada; ya existen todos los ids).
      for (const r of parsed) {
        const action = actionByRow.get(r.rowNumber);
        if (action !== "create" && action !== "update") continue;
        if (!r.jefeCodigo) continue;
        const jefeCodigo = resolveManagerCode(r.jefeCodigo, nameToCode);
        const managerId = codigoToUserId.get(jefeCodigo);
        const userId = codigoToUserId.get(r.codigo);
        if (managerId && userId && managerId !== userId) {
          await tx.user.update({ where: { id: userId }, data: { managerId } });
        }
      }

      // 4. Bajas (solo si se marcó "padrón completo").
      if (deactivateMissing) {
        const now = new Date();
        for (const m of plan.missing) {
          await tx.user.update({
            where: { id: m.id },
            data: { activo: false, bajaAt: now },
          });
          deactivated++;
          results.push({ codigo: m.codigo, nombre: m.nombre, status: "baja" });
        }
      }
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: `Ocurrió un error al aplicar; no se guardó ningún cambio (la transacción se revirtió). Respaldo disponible: ${backupFile}. Detalle: ${
          err instanceof Error ? err.message : "desconocido"
        }`,
      },
      { status: 500 },
    );
  }

  // Filas con error del plan (informativas; no se aplicaron).
  for (const pr of plan.rows) {
    if (pr.action === "error") {
      results.push({ codigo: pr.codigo, nombre: pr.nombre, status: "error", error: pr.error });
    }
  }

  // Bitácora de auditoría.
  await prisma.importRun.create({
    data: {
      actorId: session.user.id ?? null,
      actorName: session.user.name ?? null,
      fileName: file.name || null,
      created: plan.counts.create,
      updated: plan.counts.update,
      unchanged: plan.counts.unchanged,
      errors: plan.counts.error,
      deactivated,
      backupFile,
      deactivateMode: deactivateMissing,
    },
  });

  return NextResponse.json({
    results,
    summary: {
      created: plan.counts.create,
      updated: plan.counts.update,
      unchanged: plan.counts.unchanged,
      errors: plan.counts.error,
      deactivated,
      backupFile,
    },
  });
}
