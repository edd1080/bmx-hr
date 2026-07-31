import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getEmbedInfo,
  LESSON_TIPO_META,
  LESSON_TIPO_LABELS,
  LessonTipo,
  MODALIDAD_STYLES,
  MODALIDAD_LABELS,
  Modalidad,
  formatSesion,
  parseOpciones,
} from "@/lib/courses";
import { getInitials, getAvatarColors } from "@/lib/avatar";
import { NuevaLeccionButton } from "@/components/nueva-leccion-button";
import { DeleteCourseButton } from "@/components/delete-course-button";
import { DeleteLessonButton } from "@/components/delete-lesson-button";
import { EnrollButton } from "@/components/enroll-button";
import { NuevaPreguntaButton } from "@/components/nueva-pregunta-button";
import { DeleteQuestionButton } from "@/components/delete-question-button";
import { ExamPanel } from "@/components/exam-panel";

export const dynamic = "force-dynamic";

export default async function CursoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const isHR = session!.user.isHR;
  const userId = session!.user.id;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      lessons: { orderBy: { orden: "asc" } },
      enrollments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, puesto: true, area: true } } },
      },
      questions: { orderBy: { orden: "asc" } },
    },
  });
  if (!course) notFound();

  const misIntentos = await prisma.examAttempt.findMany({
    where: { courseId: id, userId },
    orderBy: { createdAt: "desc" },
  });
  const mejorIntento = misIntentos.reduce<number | null>(
    (best, a) => (best === null || a.score > best ? a.score : best),
    null
  );
  const yaAprobado = misIntentos.some((a) => a.aprobado);
  const miCompletado = course.enrollments.some(
    (e) => e.userId === userId && e.estado === "COMPLETADO"
  );

  const modalidad = course.modalidad as Modalidad;
  const modStyle = MODALIDAD_STYLES[modalidad] ?? MODALIDAD_STYLES.VIRTUAL;
  const myEnrolled = course.enrollments.some((e) => e.userId === userId);
  const cupoLleno =
    modalidad === "PRESENCIAL" && !!course.cupo && course.enrollments.length >= course.cupo;

  const meta: { label: string; value: string }[] = [];
  if (course.instructor) meta.push({ label: "Instructor", value: course.instructor });
  if (course.horas) meta.push({ label: "Duración", value: `${course.horas} h` });
  if (modalidad === "PRESENCIAL") {
    if (course.sede) meta.push({ label: "Sede", value: course.sede });
    if (course.fechaEvento) meta.push({ label: "Fecha", value: formatSesion(course.fechaEvento) });
    meta.push({
      label: "Cupo",
      value: course.cupo ? `${course.enrollments.length} / ${course.cupo}` : `${course.enrollments.length} inscritos`,
    });
  }

  return (
    <div>
      <Link
        href="/capacitacion"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted-2 hover:text-brand-primary"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Volver a Capacitación
      </Link>

      <div className="mb-6 overflow-hidden rounded-[18px] border border-border bg-surface">
        {course.coverData && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.coverData} alt={course.titulo} className="max-h-64 w-full object-cover" />
        )}
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className="inline-block rounded-full px-3 py-1 text-[11px] font-bold"
                  style={{ background: modStyle.bg, color: modStyle.text }}
                >
                  {modStyle.icon} {MODALIDAD_LABELS[modalidad]}
                </span>
                {course.categoria && (
                  <span className="inline-block rounded-full bg-vacation-bg px-3 py-1 text-[11px] font-bold text-vacation-text">
                    {course.categoria}
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl font-bold text-brand-primary">{course.titulo}</h1>
              <p className="mt-2 max-w-2xl whitespace-pre-wrap text-[14.5px] leading-relaxed text-text-secondary">
                {course.descripcion}
              </p>
              <p className="mt-3 text-xs font-semibold text-text-muted-2">
                {course.lessons.length} {course.lessons.length === 1 ? "lección" : "lecciones"}
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-2">
              {isHR ? (
                <>
                  <NuevaLeccionButton courseId={course.id} />
                  <DeleteCourseButton courseId={course.id} />
                </>
              ) : cupoLleno && !myEnrolled ? (
                <span className="rounded-[10px] bg-danger-bg px-5 py-2.5 text-center text-sm font-bold text-danger">
                  Cupo lleno
                </span>
              ) : (
                <EnrollButton courseId={course.id} enrolled={myEnrolled} />
              )}
            </div>
          </div>

          {meta.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-divider pt-5 sm:grid-cols-4">
              {meta.map((m) => (
                <div key={m.label}>
                  <div className="text-[10.5px] font-semibold uppercase tracking-wide text-text-muted-3">
                    {m.label}
                  </div>
                  <div className="text-sm font-semibold capitalize text-brand-primary">{m.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isHR && (
        <div className="mb-6 rounded-[16px] border border-border bg-surface p-5">
          <h2 className="font-display mb-3 text-[16px] font-bold text-brand-primary">
            Inscritos ({course.enrollments.length})
          </h2>
          {course.enrollments.length === 0 ? (
            <p className="text-sm text-text-muted-3">Aún no hay colaboradores inscritos.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {course.enrollments.map((e) => {
                const av = getAvatarColors(e.user.id);
                return (
                  <div key={e.id} className="flex items-center gap-3 rounded-[11px] border border-divider px-3 py-2.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold"
                      style={{ background: av.bg, color: av.col }}
                    >
                      {getInitials(e.user.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-brand-primary">{e.user.name}</div>
                      <div className="truncate text-xs text-text-muted-2">
                        {e.user.puesto || e.user.area || "Colaborador"}
                      </div>
                    </div>
                    {e.estado === "COMPLETADO" ? (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <a
                          href={`/api/courses/${course.id}/constancia?tipo=diploma&userId=${e.user.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Constancia"
                          className="rounded-lg bg-page px-2 py-1 text-[11px] font-bold text-brand-primary hover:bg-divider"
                        >
                          📄
                        </a>
                        <a
                          href={`/api/courses/${course.id}/constancia?tipo=dc3&userId=${e.user.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="DC-3"
                          className="rounded-lg bg-page px-2 py-1 text-[11px] font-bold text-brand-primary hover:bg-divider"
                        >
                          🧾
                        </a>
                      </div>
                    ) : (
                      <span className="shrink-0 rounded-full bg-page px-2.5 py-1 text-[10.5px] font-semibold text-text-muted-2">
                        Inscrito
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {course.lessons.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm font-semibold text-brand-primary">Este curso aún no tiene lecciones</p>
          <p className="mt-1 text-sm text-text-muted-2">
            {isHR ? "Agrega videos o formularios con «Agregar lección»." : "Pronto se agregará contenido."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {course.lessons.map((lesson, i) => {
            const meta = LESSON_TIPO_META[lesson.tipo as LessonTipo] ?? LESSON_TIPO_META.LINK;
            const embed = lesson.tipo === "VIDEO" ? getEmbedInfo(lesson.url) : null;

            return (
              <section key={lesson.id} className="overflow-hidden rounded-[16px] border border-border bg-surface shadow-sm">
                <div className="flex items-center gap-3 border-b border-divider px-5 py-3.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {meta.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-bold text-brand-primary">
                      <span className="text-text-muted-3">{i + 1}.</span> {lesson.titulo}
                    </div>
                    <div className="text-xs text-text-muted-2">
                      {LESSON_TIPO_LABELS[lesson.tipo as LessonTipo] ?? "Recurso"}
                    </div>
                  </div>
                  {isHR && <DeleteLessonButton lessonId={lesson.id} />}
                </div>

                <div className="p-5">
                  {lesson.descripcion && (
                    <p className="mb-4 whitespace-pre-wrap text-[14px] leading-relaxed text-text-secondary">
                      {lesson.descripcion}
                    </p>
                  )}

                  {embed?.kind === "iframe" && (
                    <div className="aspect-video w-full overflow-hidden rounded-[12px] bg-black">
                      <iframe
                        src={embed.src}
                        title={lesson.titulo}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {embed?.kind === "video" && (
                    <video controls className="w-full rounded-[12px] bg-black">
                      <source src={embed.src} />
                    </video>
                  )}

                  {(embed?.kind === "external" || lesson.tipo !== "VIDEO") && (
                    <a
                      href={lesson.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-[10px] px-5 py-3 text-sm font-bold text-white"
                      style={{ background: meta.color }}
                    >
                      {meta.icon}{" "}
                      {lesson.tipo === "FORM"
                        ? "Abrir formulario"
                        : lesson.tipo === "VIDEO"
                          ? "Ver video"
                          : "Abrir recurso"}
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 17L17 7M9 7h8v8" />
                      </svg>
                    </a>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Examen / Evaluación del curso */}
      <div className="mt-6 rounded-[16px] border border-border bg-surface p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tint-purple-bg text-lg">📝</span>
            <div>
              <h2 className="font-display text-[16.5px] font-bold text-brand-primary">Examen del curso</h2>
              <p className="text-xs text-text-muted-2">
                {course.questions.length} {course.questions.length === 1 ? "pregunta" : "preguntas"} · mínimo para aprobar {course.puntajeAprobacion}%
              </p>
            </div>
          </div>
          {isHR && <NuevaPreguntaButton courseId={course.id} />}
        </div>

        {course.questions.length === 0 ? (
          <p className="py-4 text-center text-sm text-text-muted-3">
            {isHR
              ? "Agrega preguntas para crear el examen de este curso."
              : "Este curso aún no tiene examen."}
          </p>
        ) : isHR ? (
          <ol className="flex flex-col gap-3">
            {course.questions.map((q, qi) => {
              const opciones = parseOpciones(q.opciones);
              return (
                <li key={q.id} className="rounded-[12px] border border-divider p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-brand-primary">
                      {qi + 1}. {q.texto}
                    </p>
                    <DeleteQuestionButton questionId={q.id} />
                  </div>
                  <ul className="mt-2 flex flex-col gap-1">
                    {opciones.map((op, oi) => (
                      <li
                        key={oi}
                        className={`flex items-center gap-2 text-[13.5px] ${
                          oi === q.correcta ? "font-semibold text-success" : "text-text-secondary"
                        }`}
                      >
                        <span>{oi === q.correcta ? "✓" : "○"}</span>
                        {op}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        ) : (
          <div>
            {mejorIntento !== null && (
              <div
                className={`mb-4 flex flex-wrap items-center gap-2 rounded-[11px] px-4 py-3 text-sm font-semibold ${
                  yaAprobado ? "bg-success-bg text-success" : "bg-warning-bg text-warning"
                }`}
              >
                {yaAprobado ? "✓ Curso aprobado" : "Aún no apruebas"} · Mejor calificación: {mejorIntento}%
              </div>
            )}

            {miCompletado && (
              <div className="mb-4 flex flex-wrap gap-2.5">
                <a
                  href={`/api/courses/${course.id}/constancia?tipo=diploma`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-[10px] bg-brand-navy px-4 py-2.5 text-sm font-bold text-white"
                >
                  📄 Descargar constancia
                </a>
                <a
                  href={`/api/courses/${course.id}/constancia?tipo=dc3`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-[10px] border-[1.5px] border-border-input px-4 py-2.5 text-sm font-bold text-brand-primary hover:bg-page"
                >
                  🧾 Formato DC-3 (STPS)
                </a>
              </div>
            )}
            <ExamPanel
              courseId={course.id}
              puntajeAprobacion={course.puntajeAprobacion}
              questions={course.questions.map((q) => ({
                id: q.id,
                texto: q.texto,
                opciones: parseOpciones(q.opciones),
              }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
