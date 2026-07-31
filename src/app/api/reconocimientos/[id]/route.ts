import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Puede eliminar el autor del reconocimiento o Gente y Gestión.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;
  const rec = await prisma.reconocimiento.findUnique({ where: { id }, select: { id: true, deId: true } });
  if (!rec) return NextResponse.json({ error: "Reconocimiento no encontrado." }, { status: 404 });
  if (rec.deId !== session.user.id && !session.user.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  await prisma.reconocimiento.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
