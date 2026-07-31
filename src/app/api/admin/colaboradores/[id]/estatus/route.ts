import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Alta/baja del colaborador (desactivar conserva su historial).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json({ error: "No puedes darte de baja a ti mismo." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Colaborador no encontrado." }, { status: 404 });

  const { activo } = (await request.json()) as { activo?: boolean };
  const nuevoActivo = Boolean(activo);

  const updated = await prisma.user.update({
    where: { id },
    data: { activo: nuevoActivo, bajaAt: nuevoActivo ? null : new Date() },
  });

  return NextResponse.json({ ok: true, activo: updated.activo });
}
