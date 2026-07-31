import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOnboardingRole, canConfigure, recomputeEstado } from "@/lib/onboarding-server";
import { auth } from "@/auth";

async function loadSession(id: string) {
  return prisma.onboardingSession.findUnique({
    where: { id },
    include: { config: { include: { posicion: { select: { id: true, areaId: true } } } } },
  });
}

// Edita el detalle de una sesión (objetivo, duración, tipo, material, evidencia).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = await getOnboardingRole();
  const { id } = await params;
  const s = await loadSession(id);
  if (!s) return NextResponse.json({ error: "Sesión no encontrada." }, { status: 404 });
  if (!canConfigure(role, s.config.posicion.areaId)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = (await request.json()) as {
    objetivo?: string;
    duracionMin?: number;
    tipo?: string;
    material?: string;
    evidencia?: string;
  };
  const data: Record<string, unknown> = {};
  if (body.objetivo !== undefined) data.objetivo = body.objetivo.trim() || null;
  if (body.duracionMin !== undefined && Number.isFinite(body.duracionMin)) data.duracionMin = Math.max(0, Math.round(body.duracionMin));
  if (body.tipo === "obligatoria" || body.tipo === "recomendada") data.tipo = body.tipo;
  if (body.material !== undefined) data.material = body.material.trim() || null;
  if (["firma", "checklist", "evaluacion", "ninguna"].includes(body.evidencia ?? "")) data.evidencia = body.evidencia;

  await prisma.onboardingSession.update({ where: { id }, data });
  const estado = await recomputeEstado(s.config.posicion.id, session!.user.id);
  return NextResponse.json({ ok: true, estado });
}

// Quita una sesión del onboarding.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = await getOnboardingRole();
  const { id } = await params;
  const s = await loadSession(id);
  if (!s) return NextResponse.json({ error: "Sesión no encontrada." }, { status: 404 });
  if (!canConfigure(role, s.config.posicion.areaId)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  await prisma.onboardingSession.delete({ where: { id } });
  const estado = await recomputeEstado(s.config.posicion.id, session!.user.id);
  return NextResponse.json({ ok: true, estado });
}
