import { getEmpresa } from "@/lib/empresas";

// Convierte una fecha "AAAA-MM-DD" a medianoche UTC (o null si viene vacía/ inválida).
export function parseIsoDate(value: unknown): Date | null {
  const s = String(value ?? "").trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseCategoria(value: unknown): "ADMINISTRATIVO" | "OPERATIVO" {
  return String(value ?? "").trim().toUpperCase().startsWith("OPER") ? "OPERATIVO" : "ADMINISTRATIVO";
}

export function parseEmpresa(value: unknown): string | null {
  const e = getEmpresa(value as string);
  return e ? e.clave : null;
}

export function cleanStr(value: unknown): string {
  return String(value ?? "").trim();
}
