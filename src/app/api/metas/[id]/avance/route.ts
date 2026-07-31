import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidAvancePct, isValidMes } from "@/lib/metas";
import { upsertMetaAvance } from "@/lib/metas-server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const meta = await prisma.meta.findUnique({ where: { id } });
  if (!meta) {
    return NextResponse.json({ error: "Meta no encontrada." }, { status: 404 });
  }
  if (meta.userId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  if (meta.estado !== "APROBADA") {
    return NextResponse.json(
      { error: "Solo puedes registrar avance de metas ya aprobadas." },
      { status: 400 }
    );
  }

  const { mes, avancePct, comentario } = (await request.json()) as {
    mes: number;
    avancePct: number;
    comentario?: string;
  };

  if (!isValidMes(mes)) {
    return NextResponse.json({ error: "Mes inválido." }, { status: 400 });
  }
  if (!isValidAvancePct(avancePct)) {
    return NextResponse.json(
      { error: "El avance debe ser un porcentaje entero de 0 a 100." },
      { status: 400 }
    );
  }

  const avance = await upsertMetaAvance(id, mes, avancePct, comentario?.trim() || null);
  return NextResponse.json({ ok: true, avance });
}
