export const TICKET_AREAS = [
  "RH",
  "CAPACITACION",
  "SISTEMAS",
  "MANTENIMIENTO",
  "COMPRAS",
  "ADMINISTRACION",
] as const;
export type TicketArea = (typeof TICKET_AREAS)[number];

export const AREA_META: Record<TicketArea, { label: string; icon: string; bg: string; text: string }> = {
  RH: { label: "Recursos Humanos", icon: "👥", bg: "var(--vacation-bg)", text: "var(--vacation-text)" },
  CAPACITACION: { label: "Capacitación", icon: "🎓", bg: "var(--teal-bg)", text: "var(--teal)" },
  SISTEMAS: { label: "Sistemas", icon: "💻", bg: "var(--tint-purple-bg)", text: "var(--tint-purple-fg)" },
  MANTENIMIENTO: { label: "Mantenimiento", icon: "🔧", bg: "var(--warning-bg)", text: "var(--warning)" },
  COMPRAS: { label: "Compras", icon: "🛒", bg: "var(--tint-pink-bg)", text: "var(--tint-pink-fg)" },
  ADMINISTRACION: { label: "Administración", icon: "📋", bg: "var(--earlyfriday-bg)", text: "var(--earlyfriday-text)" },
};

export const TICKET_PRIORIDADES = ["BAJA", "MEDIA", "ALTA"] as const;
export type TicketPrioridad = (typeof TICKET_PRIORIDADES)[number];

export const PRIORIDAD_META: Record<TicketPrioridad, { label: string; bg: string; text: string }> = {
  BAJA: { label: "Baja", bg: "var(--tint-gray-bg)", text: "var(--tint-gray-fg)" },
  MEDIA: { label: "Media", bg: "var(--warning-bg)", text: "var(--warning)" },
  ALTA: { label: "Alta", bg: "var(--danger-bg)", text: "var(--danger)" },
};

export const TICKET_ESTADOS = ["ABIERTO", "EN_PROCESO", "RESUELTO", "CERRADO"] as const;
export type TicketEstado = (typeof TICKET_ESTADOS)[number];

export const ESTADO_META: Record<TicketEstado, { label: string; bg: string; text: string }> = {
  ABIERTO: { label: "Abierto", bg: "var(--vacation-bg)", text: "var(--vacation-text)" },
  EN_PROCESO: { label: "En proceso", bg: "var(--warning-bg)", text: "var(--warning)" },
  RESUELTO: { label: "Resuelto", bg: "var(--success-bg)", text: "var(--success)" },
  CERRADO: { label: "Cerrado", bg: "var(--tint-gray-bg)", text: "var(--tint-gray-fg)" },
};

export const TICKET_ASUNTO_MAX = 140;
export const TICKET_DESC_MAX = 3000;

export function isValidArea(v: unknown): v is TicketArea {
  return (TICKET_AREAS as readonly string[]).includes(String(v));
}
export function isValidPrioridad(v: unknown): v is TicketPrioridad {
  return (TICKET_PRIORIDADES as readonly string[]).includes(String(v));
}
export function isValidEstado(v: unknown): v is TicketEstado {
  return (TICKET_ESTADOS as readonly string[]).includes(String(v));
}

// Folio legible derivado del id (no requiere secuencia en BD).
export function ticketFolio(id: string): string {
  return `MA-${id.slice(-6).toUpperCase()}`;
}
