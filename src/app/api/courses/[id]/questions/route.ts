import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  QUESTION_TEXTO_MAX,
  QUESTION_MIN_OPCIONES,
  QUESTION_MAX_OPCIONES,
} from "@/lib/courses";

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
  const texto = String(body.texto ?? "").trim();
  const opcionesRaw = Array.isArray(body.opciones) ? body.opciones : [];
  const opciones = opcionesRaw.map((o) => String(o ?? "").trim()).filter((o) => o.length > 0);
  const correcta = Number(body.correcta);

  if (!texto || texto.length > QUESTION_TEXTO_MAX) {
    return NextResponse.json(
      { error: `La pregunta es obligatoria (máx. ${QUESTION_TEXTO_MAX} caracteres).` },
      { status: 400 }
    );
  }
  if (opciones.length < QUESTION_MIN_OPCIONES || opciones.length > QUESTION_MAX_OPCIONES) {
    return NextResponse.json(
      { error: `Agrega entre ${QUESTION_MIN_OPCIONES} y ${QUESTION_MAX_OPCIONES} opciones.` },
      { status: 400 }
    );
  }
  if (!Number.isInteger(correcta) || correcta < 0 || correcta >= opciones.length) {
    return NextResponse.json({ error: "Marca cuál opción es la correcta." }, { status: 400 });
  }

  const last = await prisma.question.findFirst({
    where: { courseId },
    orderBy: { orden: "desc" },
    select: { orden: true },
  });

  const question = await prisma.question.create({
    data: {
      courseId,
      texto,
      opciones: JSON.stringify(opciones),
      correcta,
      orden: (last?.orden ?? 0) + 1,
    },
  });

  return NextResponse.json({ ok: true, question });
}
