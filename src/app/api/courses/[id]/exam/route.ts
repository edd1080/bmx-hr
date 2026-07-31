import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// El colaborador envía sus respuestas; el examen se califica automáticamente en el
// servidor (las respuestas correctas nunca viajan al cliente). Si aprueba, se marca
// su inscripción como COMPLETADA.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { id: courseId } = await params;
  const [course, questions] = await Promise.all([
    prisma.course.findUnique({ where: { id: courseId } }),
    prisma.question.findMany({ where: { courseId }, orderBy: { orden: "asc" } }),
  ]);

  if (!course) {
    return NextResponse.json({ error: "Curso no encontrado." }, { status: 404 });
  }
  if (questions.length === 0) {
    return NextResponse.json({ error: "Este curso no tiene examen." }, { status: 400 });
  }

  const body = (await request.json()) as { answers?: Record<string, number> };
  const answers = body.answers ?? {};

  let aciertos = 0;
  for (const q of questions) {
    if (Number(answers[q.id]) === q.correcta) aciertos++;
  }
  const score = Math.round((aciertos / questions.length) * 100);
  const aprobado = score >= course.puntajeAprobacion;

  const attempt = await prisma.examAttempt.create({
    data: { courseId, userId: session.user.id, score, aprobado },
  });

  // Si aprueba, marca la inscripción como completada (creándola si no existía).
  if (aprobado) {
    await prisma.enrollment.upsert({
      where: { courseId_userId: { courseId, userId: session.user.id } },
      update: { estado: "COMPLETADO", completedAt: new Date() },
      create: { courseId, userId: session.user.id, estado: "COMPLETADO", completedAt: new Date() },
    });
  }

  return NextResponse.json({
    ok: true,
    score,
    aprobado,
    aciertos,
    total: questions.length,
    attemptId: attempt.id,
  });
}
