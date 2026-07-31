import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidRsvp } from "@/lib/comunicacion";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { estado?: unknown };
  if (!isValidRsvp(body.estado)) {
    return NextResponse.json({ error: "Estado de asistencia inválido." }, { status: 400 });
  }

  const evento = await prisma.evento.findUnique({ where: { id }, select: { id: true } });
  if (!evento) return NextResponse.json({ error: "Evento no encontrado." }, { status: 404 });

  await prisma.eventoRSVP.upsert({
    where: { eventoId_userId: { eventoId: id, userId: session.user.id } },
    create: { eventoId: id, userId: session.user.id, estado: body.estado },
    update: { estado: body.estado },
  });

  return NextResponse.json({ ok: true, estado: body.estado });
}
