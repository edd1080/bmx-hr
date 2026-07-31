import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { computeVigencia } from "@/lib/courses";

/**
 * Recordatorios de capacitación creados de forma perezosa cuando el colaborador
 * abre la app (la app no tiene cron). Idempotentes por marca en relatedRequestId:
 *  - Curso presencial próximo (≤ 3 días) al que está inscrito y no ha completado.
 *  - Constancia por vencer o vencida (una vez por mes por curso).
 */
export async function ensureCapacitacionReminders(userId: string, today = new Date()) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: { course: true },
  });
  if (enrollments.length === 0) return;

  const markerMes = `${today.getFullYear()}-${today.getMonth() + 1}`;

  for (const e of enrollments) {
    const c = e.course;

    // 1) Sesión presencial próxima
    if (
      e.estado !== "COMPLETADO" &&
      c.modalidad === "PRESENCIAL" &&
      c.fechaEvento
    ) {
      const dias = Math.floor((c.fechaEvento.getTime() - today.getTime()) / 86400000);
      if (dias >= 0 && dias <= 3) {
        const marker = `capre-${c.id}`;
        const ya = await prisma.notification.findFirst({
          where: { userId, relatedRequestId: marker },
          select: { id: true },
        });
        if (!ya) {
          const cuando = c.fechaEvento.toLocaleString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          });
          await notify(
            userId,
            `📅 Recordatorio: tu curso presencial "${c.titulo}" es el ${cuando}${c.sede ? ` en ${c.sede}` : ""}.`,
            marker
          );
        }
      }
    }

    // 2) Constancia por vencer / vencida
    if (e.estado === "COMPLETADO" && c.vigenciaMeses) {
      const { estado, venceEl } = computeVigencia(e.completedAt, c.vigenciaMeses, today);
      if ((estado === "POR_VENCER" || estado === "VENCIDO") && venceEl) {
        const marker = `capvenc-${c.id}-${markerMes}`;
        const ya = await prisma.notification.findFirst({
          where: { userId, relatedRequestId: marker },
          select: { id: true },
        });
        if (!ya) {
          const venceTxt = venceEl.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
          await notify(
            userId,
            estado === "VENCIDO"
              ? `⚠️ Tu constancia de "${c.titulo}" venció el ${venceTxt}. Debes volver a tomar el curso.`
              : `⏳ Tu constancia de "${c.titulo}" vence el ${venceTxt}. Renuévala a tiempo.`,
            marker
          );
        }
      }
    }
  }
}
