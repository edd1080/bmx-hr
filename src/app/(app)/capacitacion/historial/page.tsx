import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MODALIDAD_LABELS, MODALIDAD_STYLES, Modalidad, computeVigencia, VIGENCIA_META } from "@/lib/courses";

export const dynamic = "force-dynamic";

export default async function HistorialPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [enrollments, attempts] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { course: true },
    }),
    prisma.examAttempt.findMany({ where: { userId } }),
  ]);

  // Mejor calificación aprobada por curso.
  const bestByCourse = new Map<string, number>();
  for (const a of attempts) {
    if (!a.aprobado) continue;
    const prev = bestByCourse.get(a.courseId);
    if (prev === undefined || a.score > prev) bestByCourse.set(a.courseId, a.score);
  }

  const completados = enrollments.filter((e) => e.estado === "COMPLETADO");
  const totalHoras = completados.reduce((sum, e) => sum + (e.course.horas ?? 0), 0);
  const now = new Date();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[23px] font-bold text-brand-primary">
            Historial de capacitación
          </h1>
          <p className="mt-0.5 text-sm text-text-muted-2">Tus cursos, calificaciones y constancias</p>
        </div>
        <Link
          href="/capacitacion"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted-2 hover:text-brand-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Volver a Capacitación
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Kpi label="Cursos inscritos" value={String(enrollments.length)} icon="📚" />
        <Kpi label="Cursos completados" value={String(completados.length)} icon="✅" />
        <Kpi label="Horas acreditadas" value={String(totalHoras)} icon="⏱️" />
      </div>

      {enrollments.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-border bg-surface p-10 text-center">
          <div className="text-3xl">🎓</div>
          <p className="mt-2 text-sm font-semibold text-brand-primary">Aún no te has inscrito a cursos</p>
          <p className="mt-1 text-sm text-text-muted-2">Explora el catálogo en Capacitación.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[16px] border border-border bg-surface">
          {enrollments.map((e) => {
            const completado = e.estado === "COMPLETADO";
            const score = bestByCourse.get(e.courseId);
            const mod = e.course.modalidad as Modalidad;
            const modStyle = MODALIDAD_STYLES[mod] ?? MODALIDAD_STYLES.VIRTUAL;
            return (
              <div key={e.id} className="flex flex-wrap items-center gap-3 border-b border-divider px-5 py-4 last:border-0">
                <div className="min-w-[180px] flex-1">
                  <Link href={`/capacitacion/${e.courseId}`} className="text-sm font-bold text-brand-primary hover:text-brand-accent">
                    {e.course.titulo}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-text-muted-2">
                    <span
                      className="rounded-full px-2 py-0.5 font-semibold"
                      style={{ background: modStyle.bg, color: modStyle.text }}
                    >
                      {MODALIDAD_LABELS[mod]}
                    </span>
                    {e.course.horas ? <span>{e.course.horas} h</span> : null}
                    {score != null && <span>· Calificación {score}%</span>}
                  </div>
                </div>

                {completado ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-success-bg px-3 py-1 text-[11px] font-bold text-success">
                      ✓ Completado
                    </span>
                    {(() => {
                      const { estado, venceEl } = computeVigencia(e.completedAt, e.course.vigenciaMeses, now);
                      if (estado === "SIN_VENCIMIENTO") return null;
                      const m = VIGENCIA_META[estado];
                      return (
                        <span
                          className="rounded-full px-3 py-1 text-[11px] font-bold"
                          style={{ background: m.bg, color: m.text }}
                          title={venceEl ? `Vence ${venceEl.toLocaleDateString("es-MX")}` : ""}
                        >
                          {m.label}
                        </span>
                      );
                    })()}
                  </div>
                ) : (
                  <span className="rounded-full bg-warning-bg px-3 py-1 text-[11px] font-bold text-warning">
                    En curso
                  </span>
                )}

                {completado && (
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/api/courses/${e.courseId}/constancia?tipo=diploma`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Descargar constancia"
                      className="rounded-lg bg-page px-2.5 py-1.5 text-[11px] font-bold text-brand-primary hover:bg-divider"
                    >
                      📄 Constancia
                    </a>
                    <a
                      href={`/api/courses/${e.courseId}/constancia?tipo=dc3`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Descargar DC-3"
                      className="rounded-lg bg-page px-2.5 py-1.5 text-[11px] font-bold text-brand-primary hover:bg-divider"
                    >
                      🧾 DC-3
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-[14px] border border-border bg-surface p-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-text-muted-2">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="font-display text-[24px] font-extrabold leading-none text-brand-primary">{value}</div>
    </div>
  );
}
