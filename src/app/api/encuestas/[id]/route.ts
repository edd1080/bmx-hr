import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Cerrar / reabrir la encuesta.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const enc = await prisma.encuesta.findUnique({ where: { id }, select: { id: true } });
  if (!enc) return NextResponse.json({ error: "Encuesta no encontrada." }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as { cerrada?: unknown };
  await prisma.encuesta.update({ where: { id }, data: { cerrada: Boolean(body.cerrada) } });
  return NextResponse.json({ ok: true, cerrada: Boolean(body.cerrada) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const enc = await prisma.encuesta.findUnique({ where: { id }, select: { id: true } });
  if (!enc) return NextResponse.json({ error: "Encuesta no encontrada." }, { status: 404 });
  await prisma.encuesta.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
