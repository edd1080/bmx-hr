import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// Crea un nuevo ingreso y MATERIALIZA su plan: una PlanSesion por cada
// OnboardingSession de la config de la posición (copia objetivo/duración/tipo/orden).
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "Solo Gente y Gestión registra nuevos ingresos." }, { status: 403 });
  }

  const { colaboradorNombre, posicionId, fechaIngreso } = (await request.json()) as {
    colaboradorNombre?: string;
    posicionId?: string;
    fechaIngreso?: string;
  };
  if (!colaboradorNombre?.trim() || !posicionId || !fechaIngreso) {
    return NextResponse.json({ error: "Faltan datos (nombre, posición y fecha)." }, { status: 400 });
  }
  const fecha = new Date(fechaIngreso);
  if (Number.isNaN(fecha.getTime())) {
    return NextResponse.json({ error: "Fecha de ingreso inválida." }, { status: 400 });
  }

  const posicion = await prisma.posicion.findUnique({
    where: { id: posicionId },
    include: { config: { include: { sesiones: { orderBy: { orden: "asc" } } } } },
  });
  if (!posicion) return NextResponse.json({ error: "Posición no encontrada." }, { status: 404 });

  const sesiones = posicion.config?.sesiones ?? [];

  const hire = await prisma.$transaction(async (tx) => {
    const nuevo = await tx.nuevoIngreso.create({
      data: {
        colaboradorNombre: colaboradorNombre.trim(),
        posicionId,
        fechaIngreso: fecha,
        creadoPor: session.user.id,
      },
    });
    for (const s of sesiones) {
      await tx.planSesion.create({
        data: {
          planId: nuevo.id,
          posicionResponsableId: s.posicionResponsableId,
          responsableId: null, // titular se muestra desde Posicion.titularNombre (User.puesto vacío)
          estado: "pendiente",
          tipo: s.tipo,
          objetivo: s.objetivo,
          duracionMin: s.duracionMin,
          orden: s.orden,
        },
      });
    }
    return nuevo;
  });

  return NextResponse.json({ ok: true, id: hire.id, sesiones: sesiones.length });
}
