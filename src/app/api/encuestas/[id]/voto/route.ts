import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { opcionId?: string };
  const opcionId = String(body.opcionId ?? "");

  const encuesta = await prisma.encuesta.findUnique({
    where: { id },
    include: { opciones: { select: { id: true } } },
  });
  if (!encuesta) return NextResponse.json({ error: "Encuesta no encontrada." }, { status: 404 });
  if (encuesta.cerrada) return NextResponse.json({ error: "Esta encuesta ya está cerrada." }, { status: 409 });
  if (!encuesta.opciones.some((o) => o.id === opcionId)) {
    return NextResponse.json({ error: "Opción inválida." }, { status: 400 });
  }

  const previo = await prisma.encuestaVoto.findUnique({
    where: { encuestaId_userId: { encuestaId: id, userId } },
    select: { id: true },
  });
  if (previo) return NextResponse.json({ error: "Ya votaste en esta encuesta." }, { status: 409 });

  await prisma.encuestaVoto.create({ data: { encuestaId: id, opcionId, userId } });
  return NextResponse.json({ ok: true });
}
