import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import {
  ENCUESTA_PREGUNTA_MAX,
  ENCUESTA_OPCION_MAX,
  ENCUESTA_MIN_OPCIONES,
  ENCUESTA_MAX_OPCIONES,
} from "@/lib/comunicacion";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "Solo Gente y Gestión puede publicar encuestas." }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const pregunta = String(body.pregunta ?? "").trim();
  const opcionesRaw = Array.isArray(body.opciones) ? body.opciones.map((o) => String(o ?? "").trim()) : [];
  const opciones = opcionesRaw.filter((o) => o.length > 0);

  if (!pregunta || pregunta.length > ENCUESTA_PREGUNTA_MAX) {
    return NextResponse.json({ error: `La pregunta es obligatoria (máx. ${ENCUESTA_PREGUNTA_MAX}).` }, { status: 400 });
  }
  if (opciones.length < ENCUESTA_MIN_OPCIONES) {
    return NextResponse.json({ error: `Agrega al menos ${ENCUESTA_MIN_OPCIONES} opciones.` }, { status: 400 });
  }
  if (opciones.length > ENCUESTA_MAX_OPCIONES) {
    return NextResponse.json({ error: `Máximo ${ENCUESTA_MAX_OPCIONES} opciones.` }, { status: 400 });
  }
  if (opciones.some((o) => o.length > ENCUESTA_OPCION_MAX)) {
    return NextResponse.json({ error: "Alguna opción es demasiado larga." }, { status: 400 });
  }

  const encuesta = await prisma.encuesta.create({
    data: {
      authorId: session.user.id,
      pregunta,
      opciones: { create: opciones.map((texto, orden) => ({ texto, orden })) },
    },
  });

  const users = await prisma.user.findMany({ where: { activo: true }, select: { id: true } });
  await Promise.all(
    users.filter((u) => u.id !== session.user.id).map((u) => notify(u.id, `📊 Nueva encuesta: ${pregunta}`, encuesta.id, "/comunicacion"))
  );

  return NextResponse.json({ ok: true, encuesta: { id: encuesta.id } });
}
