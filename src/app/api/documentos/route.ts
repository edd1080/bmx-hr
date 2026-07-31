import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { getAudienceUsers } from "@/lib/firma-server";
import {
  DOCUMENTO_TITULO_MAX,
  DOCUMENTO_CUERPO_MAX,
  DOCUMENTO_ARCHIVO_MAX_CHARS,
  DOCUMENTO_TIPO_META,
  isValidDocumentoTipo,
  isValidDocumentoAlcance,
  isValidDocumentoArchivo,
} from "@/lib/firma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "Solo Gente y Gestión puede publicar documentos para firma." }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const tipo = body.tipo;
  const titulo = String(body.titulo ?? "").trim();
  const cuerpo = String(body.cuerpo ?? "").trim();
  const alcance = body.alcance;
  const area = String(body.area ?? "").trim();
  const vigencia = String(body.vigencia ?? "").trim();
  const archivoData = body.archivoData;
  const archivoNombre = String(body.archivoNombre ?? "").trim();
  const destinatarios = Array.isArray(body.destinatarios) ? body.destinatarios.map(String) : [];

  if (!isValidDocumentoTipo(tipo)) {
    return NextResponse.json({ error: "Tipo de documento inválido." }, { status: 400 });
  }
  if (!titulo || titulo.length > DOCUMENTO_TITULO_MAX) {
    return NextResponse.json(
      { error: `El título es obligatorio (máx. ${DOCUMENTO_TITULO_MAX} caracteres).` },
      { status: 400 }
    );
  }
  if (!cuerpo || cuerpo.length > DOCUMENTO_CUERPO_MAX) {
    return NextResponse.json({ error: "El contenido del documento es obligatorio." }, { status: 400 });
  }
  if (!isValidDocumentoAlcance(alcance)) {
    return NextResponse.json({ error: "Selecciona a quién va dirigido." }, { status: 400 });
  }

  // Resolver la audiencia según el alcance.
  let areaFinal: string | null = null;
  let destinatariosFinal: string[] = [];
  if (alcance === "AREA") {
    if (!area) return NextResponse.json({ error: "Selecciona el área destinataria." }, { status: 400 });
    const count = await prisma.user.count({ where: { activo: true, area } });
    if (count === 0) {
      return NextResponse.json({ error: "No hay colaboradores activos en esa área." }, { status: 400 });
    }
    areaFinal = area;
  } else if (alcance === "SELECCION") {
    const validos = await prisma.user.findMany({
      where: { id: { in: destinatarios }, activo: true },
      select: { id: true },
    });
    destinatariosFinal = validos.map((u) => u.id);
    if (destinatariosFinal.length === 0) {
      return NextResponse.json({ error: "Selecciona al menos un colaborador." }, { status: 400 });
    }
  }

  // Archivo adjunto opcional (PDF o imagen) como data URL.
  let archivo: string | null = null;
  if (archivoData != null && archivoData !== "") {
    if (!isValidDocumentoArchivo(archivoData) || (archivoData as string).length > DOCUMENTO_ARCHIVO_MAX_CHARS) {
      return NextResponse.json(
        { error: "El archivo no es válido (usa PDF o imagen) o es demasiado grande." },
        { status: 400 }
      );
    }
    archivo = archivoData as string;
  }

  const documento = await prisma.documento.create({
    data: {
      authorId: session.user.id,
      tipo,
      titulo,
      cuerpo,
      alcance,
      area: areaFinal,
      vigencia: vigencia || null,
      archivoData: archivo,
      archivoNombre: archivo ? archivoNombre || "documento" : null,
      destinatarios:
        alcance === "SELECCION"
          ? { create: destinatariosFinal.map((userId) => ({ userId })) }
          : undefined,
    },
  });

  // Avisa a cada destinatario que tiene un documento por firmar.
  const audiencia = await getAudienceUsers(documento);
  const emoji = DOCUMENTO_TIPO_META[documento.tipo as keyof typeof DOCUMENTO_TIPO_META]?.icon ?? "📄";
  await Promise.all(
    audiencia
      .filter((u) => u.id !== session.user.id)
      .map((u) => notify(u.id, `${emoji} Tienes un documento por firmar: ${titulo}`, documento.id))
  );

  return NextResponse.json({ ok: true, documento: { id: documento.id }, destinatarios: audiencia.length });
}
