import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOnboardingRole } from "@/lib/onboarding-server";
import { NuevoIngreso } from "@/components/onboarding/nuevo-ingreso";

export const dynamic = "force-dynamic";

export default async function NuevoIngresoPage() {
  const role = await getOnboardingRole();
  if (role.role !== "rh") redirect("/onboarding");

  const direcciones = await prisma.direccion.findMany({
    orderBy: { nombre: "asc" },
    select: {
      nombre: true,
      posiciones: {
        orderBy: { headcount: "desc" },
        select: { id: true, nombre: true, config: { select: { estado: true, _count: { select: { sesiones: true } } } } },
      },
    },
  });
  const posiciones = direcciones.flatMap((d) =>
    d.posiciones.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      areaNombre: d.nombre,
      estado: p.config?.estado ?? "none",
      sesiones: p.config?._count.sesiones ?? 0,
    })),
  );

  return (
    <div>
      <Link
        href="/onboarding"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted-2 hover:text-brand-primary"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
        Volver a Onboarding
      </Link>
      <h1 className="font-display mb-1 text-[23px] font-bold text-brand-primary">Nuevo ingreso</h1>
      <p className="mb-6 text-sm text-text-muted">
        Elige la posición y el plan de onboarding se genera automáticamente.
      </p>
      <NuevoIngreso posiciones={posiciones} />
    </div>
  );
}
