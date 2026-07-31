import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { documentoHash } from "@/lib/firma-server";
import { NOMBRE_FIRMA_MAX } from "@/lib/firma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const nombreFirma = String(body.nombreFirma ?? "").trim();
  const aceptado = Boolean(body.aceptado);

  if (!aceptado) {
    return NextResponse.json({ error: "Debes marcar la casilla de aceptación para firmar." }, { status: 400 });
  }
  if (!nombreFirma || nombreFirma.length > NOMBRE_FIRMA_MAX) {
    return NextResponse.json({ error: "Escribe tu nombre completo como firma." }, { status: 400 });
  }

  const doc = await prisma.documento.findUnique({
    where: { id },
    include: { destinatarios: { select: { userId: true } } },
  });
  if (!doc) return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
  if (doc.cerrado) {
    return NextResponse.json({ error: "Este documento ya no admite firmas." }, { status: 409 });
  }

  // Verificar que el documento va dirigido a este colaborador.
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { area: true, activo: true } });
  if (!me || !me.activo) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const enAudiencia =
    doc.alcance === "TODOS"
      ? true
      : doc.alcance === "AREA"
        ? !!doc.area && !!me.area && doc.area === me.area
        : doc.destinatarios.some((d) => d.userId === userId);
  if (!enAudiencia) {
    return NextResponse.json({ error: "Este documento no está dirigido a ti." }, { status: 403 });
  }

  // Ya firmado (idempotente): no dupliques el acuse.
  const previa = await prisma.firma.findUnique({
    where: { documentoId_userId: { documentoId: id, userId } },
    select: { id: true },
  });
  if (previa) {
    return NextResponse.json({ error: "Ya firmaste este documento." }, { status: 409 });
  }

  const ipHint = (request.headers.get("x-forwarded-for")?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "").trim() || null;
  const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;

  const firma = await prisma.firma.create({
    data: {
      documentoId: id,
      userId,
      nombreFirma,
      hashDoc: documentoHash(doc.titulo, doc.cuerpo, doc.archivoNombre),
      ipHint,
      userAgent,
    },
  });

  return NextResponse.json({ ok: true, firma: { id: firma.id, createdAt: firma.createdAt } });
}
