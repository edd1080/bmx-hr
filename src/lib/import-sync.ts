import * as XLSX from "xlsx";
import { normalizeEmpresa } from "@/lib/empresas";
import { parseDateCell, isValidCurp, normalizeName } from "@/lib/import-columns";

// --------------------------------------------------------------------------
// Sincronización robusta Excel → base de datos.
//
// Filosofía (Opción A):
//  - El Excel es el INSUMO; la app es la fuente de la verdad.
//  - El Excel manda SOLO sobre los campos "oficiales" de RH que trae.
//  - Una celda VACÍA significa "no toques este campo" — nunca borra un dato
//    que ya exista en la app (evita wipes accidentales por columnas en blanco).
//  - Nada se escribe hasta que la persona ve el plan y confirma.
// --------------------------------------------------------------------------

// Campos que el Excel puede actualizar (los que NO están aquí —vacaciones,
// cursos, tickets, etc.— jamás los toca una importación).
export type SyncFields = {
  email?: string | null;
  curp?: string | null;
  area?: string | null;
  departamento?: string | null;
  puesto?: string | null;
  telefono?: string | null;
  category?: "ADMINISTRATIVO" | "OPERATIVO";
  vacationDaysAssigned?: number;
  hireDate?: Date | null;
  birthDate?: Date | null;
  empresa?: string | null;
  isHR?: boolean;
};

const FIELD_LABELS: Record<keyof SyncFields, string> = {
  email: "Correo",
  curp: "CURP",
  area: "Área",
  departamento: "Departamento",
  puesto: "Puesto",
  telefono: "Teléfono",
  category: "Categoría",
  vacationDaysAssigned: "Días asignados",
  hireDate: "Fecha de ingreso",
  birthDate: "Fecha de nacimiento",
  empresa: "Empresa",
  isHR: "Gente & Gestión",
};

export type ParsedRow = {
  rowNumber: number; // fila del Excel (1 = primer registro)
  codigo: string;
  nombre: string;
  jefeCodigo: string | null;
  fields: SyncFields; // solo las llaves presentes (celda no vacía)
  warnings: string[]; // avisos suaves (no bloquean): CURP inválida, fecha inválida
};

export type FieldChange = {
  field: keyof SyncFields | "managerId" | "name" | "estatus";
  label: string;
  from: string;
  to: string;
};

export type PlanRow = {
  rowNumber: number;
  codigo: string;
  nombre: string;
  action: "create" | "update" | "unchanged" | "error";
  changes: FieldChange[];
  warnings: string[];
  error?: string;
};

export type MissingRow = {
  id: string;
  codigo: string;
  nombre: string;
};

export type SyncPlan = {
  rows: PlanRow[];
  missing: MissingRow[];
  counts: {
    create: number;
    update: number;
    unchanged: number;
    error: number;
    missing: number;
    fileTotal: number;
  };
};

// Snapshot mínimo de un usuario que necesita el planificador. Se arma con un
// findMany de Prisma; se mantiene desacoplado para poder probarlo sin la BD.
export type ExistingUser = {
  id: string;
  employeeCode: string | null;
  name: string;
  email: string | null;
  curp: string | null;
  area: string | null;
  departamento: string | null;
  puesto: string | null;
  telefono: string | null;
  category: string;
  vacationDaysAssigned: number;
  hireDate: Date | null;
  birthDate: Date | null;
  empresa: string | null;
  isHR: boolean;
  managerId: string | null;
  activo: boolean;
};

function cellText(row: Record<string, unknown>, key: string): string {
  return String(row[key] ?? "").trim();
}

function parseCategoria(value: string): "ADMINISTRATIVO" | "OPERATIVO" {
  return value.trim().toLowerCase().startsWith("oper") ? "OPERATIVO" : "ADMINISTRATIVO";
}

function truthy(value: string): boolean {
  const s = value.trim().toLowerCase();
  return s === "si" || s === "sí" || s === "true" || s === "1" || s === "x";
}

function falsy(value: string): boolean {
  const s = value.trim().toLowerCase();
  return s === "no" || s === "false" || s === "0";
}

/**
 * Lee el archivo (xlsx/xls/csv) y devuelve filas parseadas. Una celda vacía
 * deja el campo FUERA de `fields` para que la sincronización sepa "no tocar".
 */
export function parseWorkbook(buffer: Buffer): ParsedRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  return raw.map((row, i) => {
    const warnings: string[] = [];
    const fields: SyncFields = {};

    const codigo = cellText(row, "Codigo");
    const nombre = cellText(row, "Nombre");
    const jefeCodigo = cellText(row, "JefeCodigo") || null;

    const correo = cellText(row, "Correo").toLowerCase();
    if (correo) fields.email = correo;

    const curpRaw = cellText(row, "CURP").toUpperCase();
    if (curpRaw) {
      if (isValidCurp(curpRaw)) fields.curp = curpRaw;
      else warnings.push(`CURP "${curpRaw}" no tiene 18 caracteres válidos; se ignora.`);
    }

    const area = cellText(row, "Area");
    if (area) fields.area = area;
    const departamento = cellText(row, "Departamento");
    if (departamento) fields.departamento = departamento;
    const puesto = cellText(row, "Puesto");
    if (puesto) fields.puesto = puesto;
    const telefono = cellText(row, "Telefono");
    if (telefono) fields.telefono = telefono;

    const categoria = cellText(row, "Categoria");
    if (categoria) fields.category = parseCategoria(categoria);

    const diasRaw = cellText(row, "DiasAsignados");
    if (diasRaw) {
      const n = Number(diasRaw);
      if (Number.isFinite(n)) fields.vacationDaysAssigned = n;
      else warnings.push(`Días asignados "${diasRaw}" no es un número; se ignora.`);
    }

    const ingresoRaw = cellText(row, "FechaIngreso");
    if (ingresoRaw) {
      const d = parseDateCell(row["FechaIngreso"]);
      if (d) fields.hireDate = d;
      else warnings.push(`Fecha de ingreso "${ingresoRaw}" inválida; se ignora.`);
    }

    const nacRaw = cellText(row, "FechaNacimiento");
    if (nacRaw) {
      const d = parseDateCell(row["FechaNacimiento"]);
      if (d) fields.birthDate = d;
      else warnings.push(`Fecha de nacimiento "${nacRaw}" inválida; se ignora.`);
    }

    const empresaRaw = cellText(row, "Empresa");
    if (empresaRaw) {
      const e = normalizeEmpresa(empresaRaw);
      if (e) fields.empresa = e;
      else warnings.push(`Empresa "${empresaRaw}" no coincide con AEX ni CSA; se ignora.`);
    }

    const rrhhRaw = cellText(row, "EsRRHH");
    if (rrhhRaw) {
      // Solo cambia a true/false si la celda trae algo explícito; en blanco
      // conserva el valor actual (no degrada a nadie por columna vacía).
      if (truthy(rrhhRaw)) fields.isHR = true;
      else if (falsy(rrhhRaw)) fields.isHR = false;
    }

    return { rowNumber: i + 1, codigo, nombre, jefeCodigo, fields, warnings };
  });
}

function dateKey(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

function displayValue(field: keyof SyncFields, value: unknown): string {
  if (value === null || value === undefined || value === "") return "(vacío)";
  if (field === "isHR") return value ? "Sí" : "No";
  if (field === "hireDate" || field === "birthDate") return dateKey(value as Date);
  return String(value);
}

/**
 * Compara una fila del Excel contra el usuario existente y devuelve los cambios.
 * Solo revisa los campos presentes en `fields` (celda no vacía en el Excel).
 */
function diffFields(fields: SyncFields, user: ExistingUser): FieldChange[] {
  const changes: FieldChange[] = [];
  const check = (field: keyof SyncFields, current: unknown, next: unknown, equal: boolean) => {
    if (!(field in fields)) return;
    if (equal) return;
    changes.push({
      field,
      label: FIELD_LABELS[field],
      from: displayValue(field, current),
      to: displayValue(field, next),
    });
  };

  check("email", user.email, fields.email, user.email === fields.email);
  check("curp", user.curp, fields.curp, user.curp === fields.curp);
  check("area", user.area, fields.area, user.area === fields.area);
  check("departamento", user.departamento, fields.departamento, user.departamento === fields.departamento);
  check("puesto", user.puesto, fields.puesto, user.puesto === fields.puesto);
  check("telefono", user.telefono, fields.telefono, user.telefono === fields.telefono);
  check("category", user.category, fields.category, user.category === fields.category);
  check(
    "vacationDaysAssigned",
    user.vacationDaysAssigned,
    fields.vacationDaysAssigned,
    user.vacationDaysAssigned === fields.vacationDaysAssigned,
  );
  check("hireDate", user.hireDate, fields.hireDate, dateKey(user.hireDate) === dateKey(fields.hireDate));
  check("birthDate", user.birthDate, fields.birthDate, dateKey(user.birthDate) === dateKey(fields.birthDate));
  check("empresa", user.empresa, fields.empresa, user.empresa === fields.empresa);
  check("isHR", user.isHR, fields.isHR, user.isHR === fields.isHR);

  return changes;
}

/**
 * Resuelve el código del jefe: acepta un código directo o el nombre completo
 * del jefe (algunas plantillas ponen el nombre en JefeCodigo). Devuelve el
 * código resuelto o el valor original si no lo encuentra por nombre.
 */
export function resolveManagerCode(jefeRaw: string, nameToCode: Map<string, string>): string {
  return nameToCode.get(normalizeName(jefeRaw)) ?? jefeRaw;
}

/**
 * Construye el plan completo (altas/cambios/sin cambios/errores/bajas) sin
 * escribir nada. `existing` son TODOS los usuarios (activos e inactivos).
 */
export function buildPlan(parsed: ParsedRow[], existing: ExistingUser[]): SyncPlan {
  const byCode = new Map<string, ExistingUser>();
  const nameToCode = new Map<string, string>();
  const idToName = new Map<string, string>();
  const codeToName = new Map<string, string>();
  for (const u of existing) {
    idToName.set(u.id, u.name);
    if (u.employeeCode) {
      byCode.set(u.employeeCode, u);
      codeToName.set(u.employeeCode, u.name);
    }
  }
  for (const r of parsed) {
    if (r.codigo && r.nombre) {
      nameToCode.set(normalizeName(r.nombre), r.codigo);
      codeToName.set(r.codigo, r.nombre); // el nombre del Excel tiene prioridad
    }
  }

  // Detectar códigos duplicados dentro del archivo.
  const seen = new Map<string, number>();
  for (const r of parsed) {
    if (r.codigo) seen.set(r.codigo, (seen.get(r.codigo) ?? 0) + 1);
  }

  // Todos los códigos válidos que aparecen en el archivo (para calcular bajas).
  const codesInFile = new Set<string>();

  const rows: PlanRow[] = parsed.map((r) => {
    const base: PlanRow = {
      rowNumber: r.rowNumber,
      codigo: r.codigo,
      nombre: r.nombre,
      action: "unchanged",
      changes: [],
      warnings: [...r.warnings],
    };

    if (!r.codigo || !r.nombre) {
      return { ...base, action: "error", error: "Falta Código o Nombre." };
    }
    if ((seen.get(r.codigo) ?? 0) > 1) {
      return { ...base, action: "error", error: `Código "${r.codigo}" está duplicado en el archivo.` };
    }

    codesInFile.add(r.codigo);
    const existingUser = byCode.get(r.codigo);

    // Resolver jefe (por código o, si no, por nombre completo) para (a) avisar
    // si no existe y (b) mostrar el cambio de jefe en la vista previa.
    let managerChange: FieldChange | null = null;
    if (r.jefeCodigo) {
      const jefeCodigo = resolveManagerCode(r.jefeCodigo, nameToCode);
      const managerExists = byCode.has(jefeCodigo) || seen.has(jefeCodigo);
      if (!managerExists) {
        base.warnings.push(`Jefe "${r.jefeCodigo}" no encontrado (ni código ni nombre); se deja sin jefe.`);
      } else {
        const targetUser = byCode.get(jefeCodigo); // undefined si el jefe es un alta nueva
        const targetName = codeToName.get(jefeCodigo) ?? jefeCodigo;
        const sameManager = !!existingUser && !!targetUser && targetUser.id === existingUser.managerId;
        if (!sameManager) {
          const currentName = existingUser?.managerId
            ? idToName.get(existingUser.managerId) ?? "(otro)"
            : null;
          managerChange = {
            field: "managerId",
            label: "Jefe directo",
            from: currentName ?? "(sin jefe)",
            to: targetName,
          };
        }
      }
    }

    if (!existingUser) {
      // Alta: se muestra el nombre como referencia del registro nuevo.
      const changes: FieldChange[] = [{ field: "name", label: "Nombre", from: "(nuevo)", to: r.nombre }];
      if (managerChange) changes.push(managerChange);
      return { ...base, action: "create", changes };
    }

    const changes = diffFields(r.fields, existingUser);
    if (existingUser.name !== r.nombre) {
      changes.unshift({ field: "name", label: "Nombre", from: existingUser.name, to: r.nombre });
    }
    if (managerChange) changes.push(managerChange);
    // Reactivación: si estaba dado de baja y vuelve a aparecer en el padrón.
    if (!existingUser.activo) {
      changes.unshift({ field: "estatus", label: "Estatus", from: "Baja", to: "Reactivar" });
    }

    return { ...base, action: changes.length > 0 ? "update" : "unchanged", changes };
  });

  // Bajas: usuarios ACTIVOS con código que ya no aparece en el archivo.
  const missing: MissingRow[] = existing
    .filter((u) => u.activo && u.employeeCode && !codesInFile.has(u.employeeCode))
    .map((u) => ({ id: u.id, codigo: u.employeeCode as string, nombre: u.name }));

  const counts = {
    create: rows.filter((r) => r.action === "create").length,
    update: rows.filter((r) => r.action === "update").length,
    unchanged: rows.filter((r) => r.action === "unchanged").length,
    error: rows.filter((r) => r.action === "error").length,
    missing: missing.length,
    fileTotal: parsed.length,
  };

  return { rows, missing, counts };
}
