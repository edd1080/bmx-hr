import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const evento = await prisma.evento.findUnique({ where: { id }, select: { id: true } });
  if (!evento) return NextResponse.json({ error: "Evento no encontrado." }, { status: 404 });
  await prisma.evento.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
