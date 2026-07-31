import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LESSON_TITULO_MAX, isValidLessonTipo, isHttpUrl } from "@/lib/courses";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { id: courseId } = await params;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Curso no encontrado." }, { status: 404 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const tipo = body.tipo;
  const titulo = String(body.titulo ?? "").trim();
  const url = String(body.url ?? "").trim();
  const descripcion = String(body.descripcion ?? "").trim();

  if (!isValidLessonTipo(tipo)) {
    return NextResponse.json({ error: "Tipo de lección inválido." }, { status: 400 });
  }
  if (!titulo || titulo.length > LESSON_TITULO_MAX) {
    return NextResponse.json(
      { error: `El título es obligatorio (máx. ${LESSON_TITULO_MAX} caracteres).` },
      { status: 400 }
    );
  }
  if (!isHttpUrl(url)) {
    return NextResponse.json(
      { error: "Ingresa una URL válida (http o https)." },
      { status: 400 }
    );
  }

  const last = await prisma.lesson.findFirst({
    where: { courseId },
    orderBy: { orden: "desc" },
    select: { orden: true },
  });

  const lesson = await prisma.lesson.create({
    data: {
      courseId,
      tipo,
      titulo,
      url,
      descripcion: descripcion || null,
      orden: (last?.orden ?? 0) + 1,
    },
  });

  return NextResponse.json({ ok: true, lesson });
}
