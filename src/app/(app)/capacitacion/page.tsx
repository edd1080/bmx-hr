import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NuevoCursoButton } from "@/components/nuevo-curso-button";
import { ModuleRoadmap } from "@/components/module-roadmap";
import { MODALIDAD_STYLES, MODALIDAD_LABELS, Modalidad, formatSesion } from "@/lib/courses";

export const dynamic = "force-dynamic";

export default async function CapacitacionPage() {
  const session = await auth();
  const isHR = session!.user.isHR;

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { lessons: true, enrollments: true } } },
  });

  const now = new Date();
  const proximasSesiones = courses
    .filter((c) => c.modalidad === "PRESENCIAL" && c.fechaEvento && c.fechaEvento.getTime() >= now.getTime())
    .sort((a, b) => a.fechaEvento!.getTime() - b.fechaEvento!.getTime());

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[23px] font-bold text-brand-primary">Capacitación</h1>
          <p className="mt-0.5 text-sm text-text-muted-2">
            Videos y formularios de formación para el equipo
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/capacitacion/universidad"
            className="inline-flex items-center gap-2 rounded-[10px] border-[1.5px] border-border-input px-4 py-3 text-sm font-bold text-brand-primary hover:bg-page"
          >
            🎓 Universidad
          </Link>
          <Link
            href="/capacitacion/rutas"
            className="inline-flex items-center gap-2 rounded-[10px] border-[1.5px] border-border-input px-4 py-3 text-sm font-bold text-brand-primary hover:bg-page"
          >
            🧭 Rutas
          </Link>
          <Link
            href="/capacitacion/historial"
            className="inline-flex items-center gap-2 rounded-[10px] border-[1.5px] border-border-input px-4 py-3 text-sm font-bold text-brand-primary hover:bg-page"
          >
            📈 Mi historial
          </Link>
          {isHR && (
            <Link
              href="/capacitacion/matriz"
              className="inline-flex items-center gap-2 rounded-[10px] border-[1.5px] border-border-input px-4 py-3 text-sm font-bold text-brand-primary hover:bg-page"
            >
              📊 Matriz
            </Link>
          )}
          {isHR && <NuevoCursoButton />}
        </div>
      </div>

      {proximasSesiones.length > 0 && (
        <div className="mb-6 rounded-[16px] border border-border bg-surface p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-warning-bg text-lg">📅</span>
            <h2 className="font-display text-[16px] font-bold text-brand-primary">Próximas sesiones presenciales</h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {proximasSesiones.map((c) => (
              <Link
                key={c.id}
                href={`/capacitacion/${c.id}`}
                className="flex flex-wrap items-center gap-3 rounded-[11px] border border-divider px-4 py-3 hover:border-brand-accent"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-warning-bg text-lg">📍</span>
                <div className="min-w-[180px] flex-1">
                  <div className="text-sm font-bold text-brand-primary">{c.titulo}</div>
                  <div className="text-xs capitalize text-text-muted-2">{formatSesion(c.fechaEvento!)}</div>
                </div>
                {c.sede && <span className="text-xs font-semibold text-text-muted">{c.sede}</span>}
                <span className="rounded-full bg-page px-2.5 py-1 text-[11px] font-semibold text-text-muted-2">
                  {c._count.enrollments}
                  {c.cupo ? ` / ${c.cupo}` : ""} inscritos
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-border bg-surface p-10 text-center">
          <div className="text-3xl">🎓</div>
          <p className="mt-2 text-sm font-semibold text-brand-primary">Aún no hay cursos</p>
          <p className="mt-1 text-sm text-text-muted-2">
            {isHR
              ? "Crea el primero con el botón «Nuevo curso»."
              : "Gente y Gestión publicará aquí los cursos de capacitación."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/capacitacion/${c.id}`}
              className="group flex flex-col overflow-hidden rounded-[16px] border border-border bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative h-36 w-full overflow-hidden bg-[linear-gradient(135deg,#1C3565,#4A88FA)]">
                {c.coverData ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.coverData} alt={c.titulo} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl">🎓</div>
                )}
                <span
                  className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{
                    background: MODALIDAD_STYLES[c.modalidad as Modalidad]?.bg ?? "#E8EEFB",
                    color: MODALIDAD_STYLES[c.modalidad as Modalidad]?.text ?? "#2A5CC7",
                  }}
                >
                  {MODALIDAD_STYLES[c.modalidad as Modalidad]?.icon} {MODALIDAD_LABELS[c.modalidad as Modalidad] ?? "Virtual"}
                </span>
                {c.categoria && (
                  <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-brand-primary">
                    {c.categoria}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-display text-[16px] font-bold text-brand-primary group-hover:text-brand-accent">
                  {c.titulo}
                </h3>
                <p className="mt-1.5 line-clamp-2 flex-1 text-[13.5px] text-text-secondary">
                  {c.descripcion}
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-text-muted-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="14" rx="2" />
                    <path d="M10 9l4 2-4 2z" />
                  </svg>
                  {c._count.lessons} {c._count.lessons === 1 ? "lección" : "lecciones"}
                  {c._count.enrollments > 0 && <span> · {c._count.enrollments} inscritos</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        <ModuleRoadmap
          title="Capacitación — funciones del módulo"
          intro="Módulo principal para administrar todo el proceso de capacitación."
          items={[
            { label: "Catálogo de cursos", done: true },
            { label: "Cursos virtuales (video)", done: true },
            { label: "Formularios y recursos", done: true },
            { label: "Cursos presenciales", done: true },
            { label: "Calendario e inscripciones", done: true },
            { label: "Evaluaciones y exámenes", done: true },
            { label: "Calificaciones", done: true },
            { label: "Diplomas y constancias", done: true },
            { label: "Historial de capacitación", done: true },
            { label: "Cumplimiento legal STPS (DC-3)", done: true },
            { label: "Universidad Corporativa", done: true },
            { label: "Rutas de aprendizaje por puesto", done: true },
            { label: "Matriz de capacitación", done: true },
            { label: "Recordatorios automáticos", done: true },
            { label: "Seguimiento de vencimientos", done: true },
          ]}
        />
      </div>
    </div>
  );
}
