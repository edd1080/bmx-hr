import { normalizeEmpresa } from "@/lib/empresas";

export const IMPORT_COLUMNS = [
  "Codigo",
  "Nombre",
  "Correo",
  "CURP",
  "JefeCodigo",
  "Area",
  "Departamento",
  "Puesto",
  "Telefono",
  "Categoria",
  "DiasAsignados",
  "FechaIngreso",
  "FechaNacimiento",
  "Empresa",
  "EsRRHH",
] as const;

export const IMPORT_COLUMN_NOTES: Record<(typeof IMPORT_COLUMNS)[number], string> = {
  Codigo: "Código de empleado, único (se usa para identificar al jefe directo de otros)",
  Nombre: "Nombre completo",
  Correo: "Correo del colaborador (se usa como usuario si está presente)",
  CURP: "CURP del colaborador (aparece en la constancia de vacaciones), opcional",
  JefeCodigo: "Código de empleado de su jefe directo (dejar vacío si no tiene)",
  Area: "Área, ej. Operaciones, Comercial, Mercadotecnia, Finanzas, Gente & Gestión",
  Departamento: "Departamento dentro del área, ej. Producción, Ventas, Diseño (usado para alertas de solapamiento)",
  Puesto: "Puesto o cargo, ej. Gerente de Manufactura (se muestra en el Organigrama y en Gestión de Metas)",
  Telefono: "Teléfono de contacto del colaborador, opcional (se muestra en su ficha del Organigrama y en Mi Perfil)",
  Categoria: "ADMINISTRATIVO u OPERATIVO (define qué permisos puede solicitar)",
  DiasAsignados: "Días de vacaciones asignados (número)",
  FechaIngreso:
    "Fecha de ingreso (AAAA-MM-DD) — se usa para calcular el período de antigüedad en la constancia de vacaciones",
  FechaNacimiento:
    "Fecha de nacimiento (AAAA-MM-DD) — se usa para el calendario de cumpleaños y la felicitación en Comunicación, opcional",
  Empresa:
    "Persona moral del colaborador para el DC-3: AEX (Alta Extracción) o CSA (Comercializadora Sanbia)",
  EsRRHH: "SI si pertenece a Gente y Gestión, si no dejar vacío",
};

function truthy(value: unknown): boolean {
  const s = String(value ?? "").trim().toLowerCase();
  return s === "si" || s === "sí" || s === "true" || s === "1" || s === "x";
}

function parseCategoria(value: unknown): "ADMINISTRATIVO" | "OPERATIVO" {
  const s = String(value ?? "").trim().toLowerCase();
  return s.startsWith("oper") ? "OPERATIVO" : "ADMINISTRATIVO";
}

// Excel's epoch for serial date numbers (1899-12-30, accounting for the leap-year bug).
const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);

// Parsea una fecha en formato Date, número serial de Excel, DD/MM/AAAA o AAAA-MM-DD.
// Se usa tanto para FechaIngreso como para FechaNacimiento.
export function parseDateCell(fechaRaw: unknown): Date | null {
  if (fechaRaw instanceof Date) {
    return new Date(Date.UTC(fechaRaw.getFullYear(), fechaRaw.getMonth(), fechaRaw.getDate()));
  }
  if (typeof fechaRaw === "number" && Number.isFinite(fechaRaw)) {
    return new Date(EXCEL_EPOCH_MS + fechaRaw * 86400000);
  }
  const s = String(fechaRaw ?? "").trim();
  if (!s) return null;

  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    const d = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const d = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

export function isValidCurp(value: string): boolean {
  return /^[A-Z0-9]{18}$/.test(value);
}

export function parseImportRow(row: Record<string, unknown>) {
  const codigo = String(row["Codigo"] ?? "").trim();
  const nombre = String(row["Nombre"] ?? "").trim();
  const correoRaw = String(row["Correo"] ?? "").trim().toLowerCase();
  const curpRaw = String(row["CURP"] ?? "").trim().toUpperCase();
  const curp = isValidCurp(curpRaw) ? curpRaw : "";
  const jefeCodigo = String(row["JefeCodigo"] ?? "").trim();
  const area = String(row["Area"] ?? "").trim();
  const departamento = String(row["Departamento"] ?? "").trim();
  const puesto = String(row["Puesto"] ?? "").trim();
  const telefono = String(row["Telefono"] ?? "").trim();
  const categoria = parseCategoria(row["Categoria"]);
  const diasAsignados = Number(row["DiasAsignados"] ?? 0) || 0;
  const esRRHH = truthy(row["EsRRHH"]);
  const hireDate = parseDateCell(row["FechaIngreso"]);
  const birthDate = parseDateCell(row["FechaNacimiento"]);
  const empresa = normalizeEmpresa(row["Empresa"]);

  return {
    codigo,
    nombre,
    correo: correoRaw || null,
    curp: curp || null,
    jefeCodigo: jefeCodigo || null,
    area: area || null,
    departamento: departamento || null,
    puesto: puesto || null,
    telefono: telefono || null,
    categoria,
    diasAsignados,
    esRRHH,
    hireDate,
    birthDate,
    empresa,
  };
}

export function normalizeName(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function generateUsername(codigo: string, correo: string | null): string {
  if (correo) return correo;
  return codigo.toLowerCase();
}

export function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
