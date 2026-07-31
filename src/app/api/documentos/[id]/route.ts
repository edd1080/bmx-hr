import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Cerrar / reabrir el documento (deja o no de admitir nuevas firmas).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const doc = await prisma.documento.findUnique({ where: { id }, select: { id: true } });
  if (!doc) return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const cerrado = Boolean(body.cerrado);
  await prisma.documento.update({ where: { id }, data: { cerrado } });
  return NextResponse.json({ ok: true, cerrado });
}

// Eliminar el documento (borra en cascada firmas y destinatarios).
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const doc = await prisma.documento.findUnique({ where: { id }, select: { id: true } });
  if (!doc) return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
  await prisma.documento.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
