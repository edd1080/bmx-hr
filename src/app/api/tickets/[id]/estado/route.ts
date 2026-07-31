import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { ESTADO_META, isValidEstado, ticketFolio, TicketEstado } from "@/lib/tickets";

// Cambio de estado del ticket — solo Gente y Gestión.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Ticket no encontrado." }, { status: 404 });

  const { estado } = (await request.json()) as { estado?: string };
  if (!isValidEstado(estado)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  const cerrado = estado === "CERRADO" || estado === "RESUELTO";
  const updated = await prisma.ticket.update({
    where: { id },
    data: {
      estado,
      closedAt: estado === "CERRADO" ? new Date() : ticket.closedAt,
    },
  });

  await notify(
    ticket.userId,
    `🎫 Tu ticket ${ticketFolio(id)} cambió a "${ESTADO_META[estado as TicketEstado].label}".`,
    id
  );
  void cerrado;

  return NextResponse.json({ ok: true, ticket: updated });
}
