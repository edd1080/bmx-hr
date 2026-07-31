import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import {
  AREA_META,
  TICKET_ASUNTO_MAX,
  TICKET_DESC_MAX,
  isValidArea,
  isValidPrioridad,
  ticketFolio,
} from "@/lib/tickets";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const area = body.area;
  const asunto = String(body.asunto ?? "").trim();
  const descripcion = String(body.descripcion ?? "").trim();
  const prioridad = isValidPrioridad(body.prioridad) ? body.prioridad : "MEDIA";

  if (!isValidArea(area)) {
    return NextResponse.json({ error: "Selecciona un área válida." }, { status: 400 });
  }
  if (!asunto || asunto.length > TICKET_ASUNTO_MAX) {
    return NextResponse.json(
      { error: `El asunto es obligatorio (máx. ${TICKET_ASUNTO_MAX} caracteres).` },
      { status: 400 }
    );
  }
  if (!descripcion || descripcion.length > TICKET_DESC_MAX) {
    return NextResponse.json({ error: "Describe tu solicitud." }, { status: 400 });
  }

  const ticket = await prisma.ticket.create({
    data: { userId: session.user.id, area, asunto, descripcion, prioridad },
  });

  // Avisa a Gente y Gestión que hay un ticket nuevo por atender.
  const hrUsers = await prisma.user.findMany({ where: { isHR: true }, select: { id: true } });
  await Promise.all(
    hrUsers
      .filter((u) => u.id !== session.user.id)
      .map((u) =>
        notify(
          u.id,
          `🎫 Nuevo ticket ${ticketFolio(ticket.id)} · ${AREA_META[area].label}: ${asunto}`,
          ticket.id
        )
      )
  );

  return NextResponse.json({ ok: true, ticket });
}
