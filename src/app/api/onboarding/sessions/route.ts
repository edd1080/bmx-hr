import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOnboardingRole, canConfigure, recomputeEstado } from "@/lib/onboarding-server";
import { auth } from "@/auth";

// Agrega una sesión (posición responsable) al onboarding de una posición.
export async function POST(request: Request) {
  const session = await auth();
  const role = await getOnboardingRole();
  if (role.role === "none") return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const { posicionId, responsableId } = (await request.json()) as {
    posicionId?: string;
    responsableId?: string;
  };
  if (!posicionId || !responsableId) {
    return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
  }
  if (posicionId === responsableId) {
    return NextResponse.json({ error: "Una posición no puede reunirse consigo misma." }, { status: 400 });
  }

  const posicion = await prisma.posicion.findUnique({ where: { id: posicionId }, select: { areaId: true } });
  if (!posicion) return NextResponse.json({ error: "Posición no encontrada." }, { status: 404 });
  if (!canConfigure(role, posicion.areaId)) {
    return NextResponse.json({ error: "Solo puedes configurar posiciones de tu dirección." }, { status: 403 });
  }

  const config = await prisma.onboardingConfig.upsert({
    where: { posicionId },
    update: { actualizadoPor: session!.user.id },
    create: { posicionId, actualizadoPor: session!.user.id },
    include: { sesiones: true },
  });

  const yaExiste = config.sesiones.some((s) => s.posicionResponsableId === responsableId);
  if (!yaExiste) {
    const orden = config.sesiones.length;
    await prisma.onboardingSession.create({
      data: { configId: config.id, posicionResponsableId: responsableId, orden },
    });
  }

  const estado = await recomputeEstado(posicionId, session!.user.id);
  return NextResponse.json({ ok: true, estado });
}
