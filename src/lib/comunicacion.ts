// Constantes y validadores compartidos del módulo Comunicación (eventos,
// encuestas, reconocimientos). Sin imports de Node: seguro en cliente y servidor.

// ---- Eventos: confirmación de asistencia ----
export const RSVP_ESTADOS = ["SI", "TALVEZ", "NO"] as const;
export type RsvpEstado = (typeof RSVP_ESTADOS)[number];

export const RSVP_META: Record<RsvpEstado, { label: string; corto: string; icon: string; bg: string; text: string }> = {
  SI: { label: "Asistiré", corto: "Sí", icon: "✓", bg: "var(--success-bg)", text: "var(--success)" },
  TALVEZ: { label: "Tal vez", corto: "Tal vez", icon: "?", bg: "var(--warning-bg)", text: "var(--warning)" },
  NO: { label: "No asistiré", corto: "No", icon: "✕", bg: "var(--danger-bg)", text: "var(--danger)" },
};

export function isValidRsvp(v: unknown): v is RsvpEstado {
  return (RSVP_ESTADOS as readonly string[]).includes(String(v));
}

// ---- Reconocimientos: categorías (kudos) ----
export const RECONOCE_CATEGORIAS = ["GRACIAS", "EQUIPO", "EXTRA_MILE", "INNOVACION", "VALORES"] as const;
export type ReconoceCategoria = (typeof RECONOCE_CATEGORIAS)[number];

export const RECONOCE_META: Record<
  ReconoceCategoria,
  { label: string; icon: string; bg: string; text: string }
> = {
  GRACIAS: { label: "¡Gracias!", icon: "🙏", bg: "var(--vacation-bg)", text: "var(--vacation-text)" },
  EQUIPO: { label: "Gran equipo", icon: "🤝", bg: "var(--teal-bg)", text: "var(--teal)" },
  EXTRA_MILE: { label: "Milla extra", icon: "🚀", bg: "var(--tint-purple-bg)", text: "var(--tint-purple-fg)" },
  INNOVACION: { label: "Innovación", icon: "💡", bg: "var(--warning-bg)", text: "var(--warning)" },
  VALORES: { label: "Vive los valores", icon: "⭐", bg: "var(--tint-pink-bg)", text: "var(--tint-pink-fg)" },
};

export function isValidReconoceCategoria(v: unknown): v is ReconoceCategoria {
  return (RECONOCE_CATEGORIAS as readonly string[]).includes(String(v));
}

// ---- Límites ----
export const EVENTO_TITULO_MAX = 120;
export const EVENTO_DESC_MAX = 4000;
export const EVENTO_LUGAR_MAX = 160;
export const ENCUESTA_PREGUNTA_MAX = 200;
export const ENCUESTA_OPCION_MAX = 100;
export const ENCUESTA_MAX_OPCIONES = 6;
export const ENCUESTA_MIN_OPCIONES = 2;
export const RECONOCE_MENSAJE_MAX = 500;
export const COMUNICACION_IMAGE_MAX_CHARS = 3_000_000;
