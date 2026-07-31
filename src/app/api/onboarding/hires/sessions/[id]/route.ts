import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const ESTADOS = ["pendiente", "agendada", "realizada"] as const;

// Actualiza una sesión del plan de un colaborador (seguimiento).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const existing = await prisma.planSesion.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Sesión no encontrada." }, { status: 404 });

  const body = (await request.json()) as {
    estado?: string;
    fecha?: string | null;
    hora?: string | null;
    comentarios?: string;
  };
  const data: Record<string, unknown> = {};
  if (body.estado && (ESTADOS as readonly string[]).includes(body.estado)) data.estado = body.estado;
  if (body.fecha !== undefined) data.fecha = body.fecha ? new Date(body.fecha) : null;
  if (body.hora !== undefined) data.hora = body.hora?.trim() || null;
  if (body.comentarios !== undefined) data.comentarios = body.comentarios.trim() || null;

  const updated = await prisma.planSesion.update({ where: { id }, data });
  return NextResponse.json({ ok: true, estado: updated.estado });
}
