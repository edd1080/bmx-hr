// NOTE: this module must stay free of server-only imports (e.g. "@/lib/prisma").
// It's imported by client components (nueva-meta-modal.tsx) for shared constants/
// validation. DB-touching helpers live in "@/lib/metas-server".

export const META_TIPOS = ["ORGANICA", "NOMINAL", "PROYECTO"] as const;
export type MetaTipo = (typeof META_TIPOS)[number];

export const META_CATEGORIAS = ["MAXIMIZAR", "TRANSFORMAR", "INTEGRAR", "DISRUPCION", "ATLAS"] as const;
export type MetaCategoria = (typeof META_CATEGORIAS)[number];

export const META_NATURALEZAS = ["CRECE", "DECRECE"] as const;
export type MetaNaturaleza = (typeof META_NATURALEZAS)[number];

// No existe un estado "RECHAZADA" aparte: un rechazo regresa la meta a BORRADOR
// (editable) con managerComment visible hasta que se vuelva a enviar.
export const META_ESTADOS = ["BORRADOR", "EN_REVISION", "APROBADA"] as const;
export type MetaEstado = (typeof META_ESTADOS)[number];

export const META_PESOS = [10, 15, 20, 25, 30, 35, 50] as const;

export const META_TIPO_LABELS: Record<MetaTipo, string> = {
  ORGANICA: "Orgánica",
  NOMINAL: "Nominal",
  PROYECTO: "Proyecto",
};

export const META_CATEGORIA_LABELS: Record<MetaCategoria, string> = {
  MAXIMIZAR: "Maximizar la operación del negocio",
  TRANSFORMAR: "Transformación del negocio",
  INTEGRAR: "Integración de negocios",
  DISRUPCION: "Disrupción",
  ATLAS: "Atlas",
};

export const META_NATURALEZA_LABELS: Record<MetaNaturaleza, string> = {
  CRECE: "Crece",
  DECRECE: "Decrece",
};

export const META_ESTADO_LABELS: Record<MetaEstado, string> = {
  BORRADOR: "Borrador",
  EN_REVISION: "En revisión",
  APROBADA: "Aprobada",
};

/** Tailwind classes for estado chips, matching the corporate design tokens. */
export const META_ESTADO_STYLES: Record<MetaEstado, string> = {
  BORRADOR: "bg-page text-text-muted",
  EN_REVISION: "bg-warning-bg text-warning",
  APROBADA: "bg-success-bg text-success",
};

export const META_DESCRIPCION_MAX_LENGTH = 50;

export function isValidPeso(peso: number): boolean {
  return (META_PESOS as readonly number[]).includes(peso);
}

/** Un Proyecto nunca aplica la regla de alcance parcial (0% o 100%, sin punto medio). */
export function normalizeAlcanceParcial(tipo: string, alcanceParcial: boolean): boolean {
  return tipo === "PROYECTO" ? false : alcanceParcial;
}

/** Suma de pesos de un conjunto de metas — el ciclo debe cerrar en 100%. */
export function sumPesos(metas: { peso: number }[]): number {
  return metas.reduce((sum, m) => sum + m.peso, 0);
}

export function getCurrentCiclo(): number {
  return new Date().getUTCFullYear();
}

/** Rango fijo del ciclo: 1 de enero a 31 de diciembre (UTC). */
export function getCicloDateRange(ciclo: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(ciclo, 0, 1)),
    end: new Date(Date.UTC(ciclo, 11, 31)),
  };
}

export const MESES_LABELS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

export function isValidMes(mes: number): boolean {
  return Number.isInteger(mes) && mes >= 1 && mes <= 12;
}

export function isValidAvancePct(pct: number): boolean {
  return Number.isInteger(pct) && pct >= 0 && pct <= 100;
}

export type MetaAvanceLike = { mes: number; avancePct: number; comentario: string | null };

/** El registro más reciente (mayor mes) — lo que jefe/GyG ven como "avance actual". */
export function getLatestAvance(avances: MetaAvanceLike[]): MetaAvanceLike | null {
  if (avances.length === 0) return null;
  return avances.reduce((latest, a) => (a.mes > latest.mes ? a : latest));
}
