import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const { action, comment } = (await request.json()) as {
    action: "APPROVE" | "REJECT";
    comment?: string;
  };

  if (action !== "APPROVE" && action !== "REJECT") {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }

  const meta = await prisma.meta.findUnique({ where: { id } });
  if (!meta) {
    return NextResponse.json({ error: "Meta no encontrada." }, { status: 404 });
  }

  // Solo el jefe directo decide — a diferencia de vacaciones, Gente y Gestión no
  // tiene aquí un botón de respaldo (decisión explícita de la clienta para esta fase).
  if (meta.managerId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  if (meta.estado !== "EN_REVISION") {
    return NextResponse.json(
      { error: "Esta meta ya fue resuelta o no está en revisión." },
      { status: 400 }
    );
  }

  const trimmedComment = comment?.trim() || "";
  if (action === "REJECT" && !trimmedComment) {
    return NextResponse.json(
      { error: "Agrega un comentario para que el colaborador sepa qué corregir." },
      { status: 400 }
    );
  }

  const updated = await prisma.meta.update({
    where: { id },
    data:
      action === "APPROVE"
        ? {
            estado: "APROBADA",
            lockedAt: new Date(),
            decidedAt: new Date(),
            managerComment: trimmedComment || null,
          }
        : {
            estado: "BORRADOR",
            decidedAt: new Date(),
            managerComment: trimmedComment,
          },
  });

  await notify(
    meta.userId,
    action === "APPROVE"
      ? `Tu meta "${meta.nombre}" fue aprobada y quedó bloqueada.`
      : `Tu meta "${meta.nombre}" fue regresada a borrador: ${trimmedComment}`
  );

  return NextResponse.json({ ok: true, meta: updated });
}
