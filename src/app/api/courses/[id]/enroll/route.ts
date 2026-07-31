import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Inscribir al usuario autenticado en el curso.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { id: courseId } = await params;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { _count: { select: { enrollments: true } } },
  });
  if (!course) {
    return NextResponse.json({ error: "Curso no encontrado." }, { status: 404 });
  }

  const existing = await prisma.enrollment.findUnique({
    where: { courseId_userId: { courseId, userId: session.user.id } },
  });
  if (existing) {
    return NextResponse.json({ ok: true, enrollment: existing });
  }

  // Valida cupo solo en cursos presenciales con cupo definido.
  if (course.modalidad === "PRESENCIAL" && course.cupo && course._count.enrollments >= course.cupo) {
    return NextResponse.json({ error: "El curso ya alcanzó su cupo máximo." }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.create({
    data: { courseId, userId: session.user.id },
  });
  return NextResponse.json({ ok: true, enrollment });
}

// Cancelar la inscripción del usuario autenticado.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { id: courseId } = await params;
  await prisma.enrollment.deleteMany({
    where: { courseId, userId: session.user.id },
  });
  return NextResponse.json({ ok: true });
}
