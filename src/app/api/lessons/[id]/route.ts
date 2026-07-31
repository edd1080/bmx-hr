import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) {
    return NextResponse.json({ error: "Lección no encontrada." }, { status: 404 });
  }

  await prisma.lesson.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
