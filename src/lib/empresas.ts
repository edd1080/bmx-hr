// Personas morales del grupo. Cada colaborador pertenece a una; se usa para el
// RFC y la razón social del formato DC-3 (STPS).
export const EMPRESAS = {
  AEX: { clave: "AEX", rfc: "AEX190612FKA", razonSocial: "Alta Extracción, S.A. de C.V." },
  CSA: { clave: "CSA", rfc: "CSA190827QP9", razonSocial: "Comercializadora Sanbia, S.A. de C.V." },
} as const;

export type EmpresaClave = keyof typeof EMPRESAS;

export const EMPRESA_CLAVES = Object.keys(EMPRESAS) as EmpresaClave[];

export function getEmpresa(clave?: string | null) {
  if (!clave) return null;
  const key = clave.trim().toUpperCase();
  return key in EMPRESAS ? EMPRESAS[key as EmpresaClave] : null;
}

// Normaliza texto libre del Excel ("Alta Extraccion", "aex", "Sanbia"...) a la clave.
export function normalizeEmpresa(value: unknown): EmpresaClave | null {
  const s = String(value ?? "").trim().toLowerCase();
  if (!s) return null;
  if (s.includes("aex") || s.includes("alta") || s.includes("extrac")) return "AEX";
  if (s.includes("csa") || s.includes("sanbia") || s.includes("comercial")) return "CSA";
  return null;
}
