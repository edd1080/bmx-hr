import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import {
  EVENTO_TITULO_MAX,
  EVENTO_DESC_MAX,
  EVENTO_LUGAR_MAX,
  COMUNICACION_IMAGE_MAX_CHARS,
} from "@/lib/comunicacion";
import { isValidImageData } from "@/lib/posts";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "Solo Gente y Gestión puede publicar eventos." }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const titulo = String(body.titulo ?? "").trim();
  const descripcion = String(body.descripcion ?? "").trim();
  const lugar = String(body.lugar ?? "").trim();
  const inicioRaw = String(body.inicio ?? "").trim();
  const finRaw = String(body.fin ?? "").trim();
  const imageData = body.imageData;

  if (!titulo || titulo.length > EVENTO_TITULO_MAX) {
    return NextResponse.json({ error: `El título es obligatorio (máx. ${EVENTO_TITULO_MAX}).` }, { status: 400 });
  }
  if (!descripcion || descripcion.length > EVENTO_DESC_MAX) {
    return NextResponse.json({ error: "La descripción es obligatoria." }, { status: 400 });
  }
  if (lugar.length > EVENTO_LUGAR_MAX) {
    return NextResponse.json({ error: "El lugar es demasiado largo." }, { status: 400 });
  }
  const inicio = new Date(inicioRaw);
  if (!inicioRaw || isNaN(inicio.getTime())) {
    return NextResponse.json({ error: "Indica la fecha y hora de inicio." }, { status: 400 });
  }
  let fin: Date | null = null;
  if (finRaw) {
    const f = new Date(finRaw);
    if (isNaN(f.getTime())) return NextResponse.json({ error: "La fecha de fin no es válida." }, { status: 400 });
    if (f.getTime() < inicio.getTime()) {
      return NextResponse.json({ error: "El fin no puede ser antes del inicio." }, { status: 400 });
    }
    fin = f;
  }

  let image: string | null = null;
  if (imageData != null && imageData !== "") {
    if (!isValidImageData(imageData) || (imageData as string).length > COMUNICACION_IMAGE_MAX_CHARS) {
      return NextResponse.json({ error: "La imagen no es válida o es demasiado grande." }, { status: 400 });
    }
    image = imageData as string;
  }

  const evento = await prisma.evento.create({
    data: { authorId: session.user.id, titulo, descripcion, lugar: lugar || null, inicio, fin, imageData: image },
  });

  // Avisa a todos los colaboradores activos del nuevo evento.
  const users = await prisma.user.findMany({ where: { activo: true }, select: { id: true } });
  await Promise.all(
    users.filter((u) => u.id !== session.user.id).map((u) => notify(u.id, `📅 Nuevo evento: ${titulo}`, evento.id, "/comunicacion"))
  );

  return NextResponse.json({ ok: true, evento: { id: evento.id } });
}
