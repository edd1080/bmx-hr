import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentCiclo, sumPesos } from "@/lib/metas";
import { getAllMetasForCiclo } from "@/lib/metas-server";
import { notify } from "@/lib/notifications";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}) as Record<string, unknown>);
  const cicloParam = Number((body as Record<string, unknown>)?.ciclo);
  const ciclo = Number.isFinite(cicloParam) && cicloParam > 0 ? cicloParam : getCurrentCiclo();

  const requester = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const allMetas = await getAllMetasForCiclo(requester.id, ciclo);
  const drafts = allMetas.filter((m) => m.estado === "BORRADOR");

  if (drafts.length === 0) {
    return NextResponse.json({ error: "No tienes metas en borrador para enviar." }, { status: 400 });
  }

  // El 100% se valida contra TODAS las metas del ciclo (borrador + en revisión + aprobadas),
  // no solo el lote que se envía ahora — así "bloqueada" significa 100% bloqueado de verdad.
  const total = sumPesos(allMetas);
  if (total !== 100) {
    return NextResponse.json(
      { error: `El peso total de tus metas debe sumar 100% (llevas ${total}%).` },
      { status: 400 }
    );
  }

  const draftIds = drafts.map((m) => m.id);
  await prisma.meta.updateMany({
    where: { id: { in: draftIds } },
    data: { estado: "EN_REVISION", managerComment: null, decidedAt: null },
  });

  const message = `${requester.name} envió ${drafts.length} meta${drafts.length === 1 ? "" : "s"} ${ciclo} para tu revisión.`;
  if (requester.managerId) {
    await notify(requester.managerId, message);
  } else {
    const hrUsers = await prisma.user.findMany({
      where: { isHR: true, id: { not: requester.id } },
      select: { id: true },
    });
    await Promise.all(hrUsers.map((u) => notify(u.id, message)));
  }

  return NextResponse.json({ ok: true, submitted: draftIds.length });
}
