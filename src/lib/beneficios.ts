export const BENEFICIO_TIPOS = ["BENEFICIO", "CONVENIO", "PROGRAMA", "DESCUENTO", "CAMPANA"] as const;
export type BeneficioTipo = (typeof BENEFICIO_TIPOS)[number];

export const BENEFICIO_TIPO_META: Record<
  BeneficioTipo,
  { label: string; plural: string; icon: string; bg: string; text: string }
> = {
  BENEFICIO: { label: "Beneficio vigente", plural: "Beneficios vigentes", icon: "🎁", bg: "var(--vacation-bg)", text: "var(--vacation-text)" },
  CONVENIO: { label: "Convenio", plural: "Convenios", icon: "🤝", bg: "var(--teal-bg)", text: "var(--teal)" },
  PROGRAMA: { label: "Programa interno", plural: "Programas internos", icon: "🌱", bg: "var(--tint-purple-bg)", text: "var(--tint-purple-fg)" },
  DESCUENTO: { label: "Descuento", plural: "Descuentos", icon: "🏷️", bg: "var(--warning-bg)", text: "var(--warning)" },
  CAMPANA: { label: "Campaña de bienestar", plural: "Campañas de bienestar", icon: "💚", bg: "var(--tint-pink-bg)", text: "var(--tint-pink-fg)" },
};

export const BENEFICIO_TITULO_MAX = 120;
export const BENEFICIO_DESC_MAX = 3000;
export const BENEFICIO_IMAGE_MAX_CHARS = 3_000_000;

export function isValidBeneficioTipo(v: unknown): v is BeneficioTipo {
  return (BENEFICIO_TIPOS as readonly string[]).includes(String(v));
}

export function isValidBeneficioImage(v: unknown): v is string {
  return typeof v === "string" && /^data:image\/(png|jpe?g|webp);base64,/.test(v);
}

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
