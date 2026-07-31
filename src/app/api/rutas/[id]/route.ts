import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const ruta = await prisma.ruta.findUnique({ where: { id } });
  if (!ruta) return NextResponse.json({ error: "Ruta no encontrada." }, { status: 404 });
  await prisma.ruta.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
