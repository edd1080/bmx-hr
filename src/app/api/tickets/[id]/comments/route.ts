import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { ticketFolio } from "@/lib/tickets";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { id: ticketId } = await params;
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return NextResponse.json({ error: "Ticket no encontrado." }, { status: 404 });

  // Solo el creador o Gente y Gestión pueden comentar.
  const isHR = session.user.isHR;
  if (ticket.userId !== session.user.id && !isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { mensaje } = (await request.json()) as { mensaje?: string };
  const texto = String(mensaje ?? "").trim();
  if (!texto) return NextResponse.json({ error: "Escribe un mensaje." }, { status: 400 });

  const comment = await prisma.ticketComment.create({
    data: { ticketId, userId: session.user.id, mensaje: texto },
  });
  await prisma.ticket.update({ where: { id: ticketId }, data: { updatedAt: new Date() } });

  const folio = ticketFolio(ticketId);
  if (isHR && ticket.userId !== session.user.id) {
    // Respuesta de G&G → avisa al colaborador.
    await notify(ticket.userId, `💬 Respuesta en tu ticket ${folio}: ${texto.slice(0, 80)}`, ticketId);
  } else {
    // Comentario del colaborador → avisa a G&G.
    const hrUsers = await prisma.user.findMany({ where: { isHR: true }, select: { id: true } });
    await Promise.all(
      hrUsers
        .filter((u) => u.id !== session.user.id)
        .map((u) => notify(u.id, `💬 Nuevo comentario en ticket ${folio}`, ticketId))
    );
  }

  return NextResponse.json({ ok: true, comment });
}
