import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// Devuelve la posición + sus sesiones de onboarding (para la vista previa del plan).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const { id } = await params;
  const posicion = await prisma.posicion.findUnique({
    where: { id },
    include: {
      area: { select: { nombre: true } },
      config: {
        select: {
          estado: true,
          sesiones: {
            orderBy: { orden: "asc" },
            select: {
              tipo: true,
              duracionMin: true,
              posicionResponsable: {
                select: { nombre: true, titularNombre: true, area: { select: { nombre: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!posicion) return NextResponse.json({ error: "Posición no encontrada." }, { status: 404 });

  const sesiones = (posicion.config?.sesiones ?? []).map((s) => ({
    nombre: s.posicionResponsable.nombre,
    titular: s.posicionResponsable.titularNombre,
    areaNombre: s.posicionResponsable.area.nombre,
    tipo: s.tipo,
    duracionMin: s.duracionMin,
  }));

  return NextResponse.json({
    nombre: posicion.nombre,
    areaNombre: posicion.area.nombre,
    estado: posicion.config?.estado ?? "none",
    sesiones,
  });
}
