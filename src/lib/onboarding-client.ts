// Constantes del módulo Onboarding seguras para cliente y servidor
// (sin imports de prisma/auth).

export const ESTADO_META: Record<string, { label: string; dot: string; chip: string }> = {
  none: { label: "Sin configurar", dot: "#8A96AD", chip: "bg-page text-text-muted-2" },
  partial: { label: "Parcial", dot: "#C68A2E", chip: "bg-warning-bg text-warning" },
  complete: { label: "Completa", dot: "#1E9E6A", chip: "bg-success-bg text-success" },
};

export const PLAN_ESTADO_META: Record<string, { label: string; chip: string; icon: string }> = {
  pendiente: { label: "Pendiente", chip: "bg-page text-text-muted-2", icon: "○" },
  agendada: { label: "Agendada", chip: "bg-vacation-bg text-vacation-text", icon: "◷" },
  realizada: { label: "Realizada", chip: "bg-success-bg text-success", icon: "✓" },
};
