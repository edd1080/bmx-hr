import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const beneficio = await prisma.beneficio.findUnique({ where: { id } });
  if (!beneficio) return NextResponse.json({ error: "Beneficio no encontrado." }, { status: 404 });
  await prisma.beneficio.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
