import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NuevaRutaButton } from "@/components/nueva-ruta-button";
import { RutaCourseManager } from "@/components/ruta-course-manager";
import { DeleteRutaButton } from "@/components/delete-ruta-button";

export const dynamic = "force-dynamic";

export default async function RutasPage() {
  const session = await auth();
  const userId = session!.user.id;
  const isHR = session!.user.isHR;

  const [rutas, allCourses, me, misCompletados] = await Promise.all([
    prisma.ruta.findMany({
      orderBy: { createdAt: "desc" },
      include: { cursos: { orderBy: { orden: "asc" }, include: { course: true } } },
    }),
    prisma.course.findMany({ orderBy: { titulo: "asc" }, select: { id: true, titulo: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { puesto: true } }),
    prisma.enrollment.findMany({
      where: { userId, estado: "COMPLETADO" },
      select: { courseId: true },
    }),
  ]);

  const puestosDisponibles = [
    ...new Set(
      (await prisma.user.findMany({ where: { puesto: { not: null } }, select: { puesto: true } }))
        .map((u) => u.puesto!)
        .filter(Boolean)
    ),
  ].sort();

  const completadoSet = new Set(misCompletados.map((e) => e.courseId));
  const miPuesto = (me?.puesto ?? "").trim().toLowerCase();
  const misRutas = miPuesto
    ? rutas.filter((r) => r.puesto.trim().toLowerCase() === miPuesto)
    : [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[23px] font-bold text-brand-primary">
            Rutas de aprendizaje por puesto
          </h1>
          <p className="mt-0.5 text-sm text-text-muted-2">
            Cursos requeridos según el puesto del colaborador
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/capacitacion"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted-2 hover:text-brand-primary"
          >
            ← Capacitación
          </Link>
          {isHR && <NuevaRutaButton puestos={puestosDisponibles} />}
        </div>
      </div>

      {/* Vista del colaborador: su ruta con progreso */}
      {!isHR && (
        <div className="mb-8">
          {misRutas.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-border bg-surface p-10 text-center">
              <div className="text-3xl">🧭</div>
              <p className="mt-2 text-sm font-semibold text-brand-primary">
                No hay una ruta asignada a tu puesto
              </p>
              <p className="mt-1 text-sm text-text-muted-2">
                Cuando Gente y Gestión defina una ruta para «{me?.puesto || "tu puesto"}», aparecerá aquí.
              </p>
            </div>
          ) : (
            misRutas.map((r) => {
              const total = r.cursos.length;
              const hechos = r.cursos.filter((rc) => completadoSet.has(rc.courseId)).length;
              const pct = total > 0 ? Math.round((hechos / total) * 100) : 0;
              return (
                <div key={r.id} className="mb-5 rounded-[16px] border border-border bg-surface p-6">
                  <h2 className="font-display text-lg font-bold text-brand-primary">{r.nombre}</h2>
                  {r.descripcion && <p className="mt-1 text-sm text-text-muted-2">{r.descripcion}</p>}
                  <div className="mb-4 mt-3 flex items-center gap-3">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-divider">
                      <div className="h-full rounded-full bg-[linear-gradient(90deg,#4A88FA,#6FA0FB)]" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-bold text-brand-primary">{hechos}/{total}</span>
                  </div>
                  <ol className="flex flex-col gap-2">
                    {r.cursos.map((rc, i) => {
                      const done = completadoSet.has(rc.courseId);
                      return (
                        <li key={rc.id}>
                          <Link
                            href={`/capacitacion/${rc.courseId}`}
                            className="flex items-center gap-3 rounded-[11px] border border-divider px-4 py-2.5 hover:border-brand-accent"
                          >
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                done ? "bg-success-bg text-success" : "bg-page text-text-muted-2"
                              }`}
                            >
                              {done ? "✓" : i + 1}
                            </span>
                            <span className="flex-1 text-sm font-semibold text-brand-primary">{rc.course.titulo}</span>
                            {done && <span className="text-xs font-bold text-success">Completado</span>}
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Vista de administración (G&G) */}
      {isHR && (
        <div className="flex flex-col gap-5">
          {rutas.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-border bg-surface p-10 text-center">
              <div className="text-3xl">🧭</div>
              <p className="mt-2 text-sm font-semibold text-brand-primary">Aún no hay rutas</p>
              <p className="mt-1 text-sm text-text-muted-2">Crea la primera con «Nueva ruta».</p>
            </div>
          ) : (
            rutas.map((r) => (
              <div key={r.id} className="rounded-[16px] border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-[16px] font-bold text-brand-primary">{r.nombre}</h2>
                    <p className="text-xs font-semibold text-text-muted-2">
                      Puesto: {r.puesto} · {r.cursos.length} cursos
                    </p>
                    {r.descripcion && <p className="mt-1 text-sm text-text-secondary">{r.descripcion}</p>}
                  </div>
                  <DeleteRutaButton rutaId={r.id} />
                </div>
                <RutaCourseManager
                  rutaId={r.id}
                  allCourses={allCourses}
                  currentIds={r.cursos.map((rc) => rc.courseId)}
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
