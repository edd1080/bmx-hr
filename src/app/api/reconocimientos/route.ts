import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { isValidReconoceCategoria, RECONOCE_MENSAJE_MAX, RECONOCE_META } from "@/lib/comunicacion";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  const deId = session.user.id;

  const body = (await request.json()) as Record<string, unknown>;
  const paraId = String(body.paraId ?? "");
  const categoria = body.categoria;
  const mensaje = String(body.mensaje ?? "").trim();

  if (!isValidReconoceCategoria(categoria)) {
    return NextResponse.json({ error: "Categoría inválida." }, { status: 400 });
  }
  if (!mensaje || mensaje.length > RECONOCE_MENSAJE_MAX) {
    return NextResponse.json({ error: `Escribe un mensaje (máx. ${RECONOCE_MENSAJE_MAX}).` }, { status: 400 });
  }
  if (!paraId || paraId === deId) {
    return NextResponse.json({ error: "Elige a un compañero distinto a ti." }, { status: 400 });
  }
  const para = await prisma.user.findFirst({ where: { id: paraId, activo: true }, select: { id: true } });
  if (!para) return NextResponse.json({ error: "El colaborador no está disponible." }, { status: 400 });

  const rec = await prisma.reconocimiento.create({
    data: { deId, paraId, categoria, mensaje },
  });

  const quien = session.user.name ?? "Alguien";
  await notify(paraId, `${RECONOCE_META[categoria].icon} ${quien} te reconoció: ${RECONOCE_META[categoria].label}`, rec.id, "/comunicacion");

  return NextResponse.json({ ok: true, reconocimiento: { id: rec.id } });
}
