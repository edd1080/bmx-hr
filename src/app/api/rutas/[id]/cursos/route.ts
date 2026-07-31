import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Agregar un curso a la ruta.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id: rutaId } = await params;
  const { courseId } = (await request.json()) as { courseId?: string };
  if (!courseId) return NextResponse.json({ error: "Falta el curso." }, { status: 400 });

  const [ruta, course, existing] = await Promise.all([
    prisma.ruta.findUnique({ where: { id: rutaId } }),
    prisma.course.findUnique({ where: { id: courseId } }),
    prisma.rutaCurso.findUnique({ where: { rutaId_courseId: { rutaId, courseId } } }),
  ]);
  if (!ruta || !course) return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  if (existing) return NextResponse.json({ ok: true, rutaCurso: existing });

  const last = await prisma.rutaCurso.findFirst({
    where: { rutaId },
    orderBy: { orden: "desc" },
    select: { orden: true },
  });
  const rutaCurso = await prisma.rutaCurso.create({
    data: { rutaId, courseId, orden: (last?.orden ?? 0) + 1 },
  });
  return NextResponse.json({ ok: true, rutaCurso });
}

// Quitar un curso de la ruta (courseId en el body).
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id: rutaId } = await params;
  const { courseId } = (await request.json()) as { courseId?: string };
  if (!courseId) return NextResponse.json({ error: "Falta el curso." }, { status: 400 });
  await prisma.rutaCurso.deleteMany({ where: { rutaId, courseId } });
  return NextResponse.json({ ok: true });
}
