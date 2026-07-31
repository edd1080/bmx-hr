import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOnboardingRole, canConfigure } from "@/lib/onboarding-server";
import { ConfigurarPosicion } from "@/components/onboarding/configurar-posicion";

export const dynamic = "force-dynamic";

export default async function ConfigurarPosicionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getOnboardingRole();
  if (role.role === "none") redirect("/dashboard");

  const posicion = await prisma.posicion.findUnique({
    where: { id },
    include: {
      area: true,
      reportaA: { select: { id: true, nombre: true } },
      reportes: { select: { id: true, nombre: true, titularNombre: true }, orderBy: { headcount: "desc" } },
      config: {
        include: {
          sesiones: {
            orderBy: { orden: "asc" },
            include: {
              posicionResponsable: {
                select: { id: true, nombre: true, titularNombre: true, area: { select: { nombre: true, color: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!posicion) notFound();

  const writable = canConfigure(role, posicion.areaId);

  // Catálogo de posiciones para el selector (agrupado por área en el cliente).
  const direcciones = await prisma.direccion.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, color: true, posiciones: { select: { id: true, nombre: true, titularNombre: true }, orderBy: { headcount: "desc" } } },
  });
  const catalogo = direcciones.flatMap((d) =>
    d.posiciones.map((p) => ({ id: p.id, nombre: p.nombre, titular: p.titularNombre, areaNombre: d.nombre, areaColor: d.color })),
  );

  const sesiones = (posicion.config?.sesiones ?? []).map((s) => ({
    id: s.id,
    responsableId: s.posicionResponsableId,
    nombre: s.posicionResponsable.nombre,
    titular: s.posicionResponsable.titularNombre,
    areaNombre: s.posicionResponsable.area.nombre,
    areaColor: s.posicionResponsable.area.color,
    objetivo: s.objetivo ?? "",
    duracionMin: s.duracionMin,
    tipo: s.tipo,
    material: s.material ?? "",
    evidencia: s.evidencia,
  }));

  return (
    <div>
      <Link
        href="/onboarding"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted-2 hover:text-brand-primary"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
        Volver a Onboarding
      </Link>

      <ConfigurarPosicion
        posicion={{
          id: posicion.id,
          nombre: posicion.nombre,
          areaNombre: posicion.area.nombre,
          areaColor: posicion.area.color,
          titular: posicion.titularNombre,
          reportaA: posicion.reportaA?.nombre ?? null,
          reportes: posicion.reportes.map((r) => ({ nombre: r.nombre, titular: r.titularNombre })),
        }}
        sesiones={sesiones}
        catalogo={catalogo}
        writable={writable}
      />
    </div>
  );
}
