import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOnboardingRole } from "@/lib/onboarding-server";
import { getInitials, getAvatarColors } from "@/lib/avatar";
import { SeguimientoPlan } from "@/components/onboarding/seguimiento-plan";

export const dynamic = "force-dynamic";

function toIso(d: Date | null): string {
  if (!d) return "";
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getOnboardingRole();
  if (role.role !== "rh") redirect("/onboarding");

  const plan = await prisma.nuevoIngreso.findUnique({
    where: { id },
    include: {
      posicion: { include: { area: { select: { nombre: true } } } },
      sesiones: {
        orderBy: { orden: "asc" },
        include: {
          posicionResponsable: { select: { nombre: true, titularNombre: true, area: { select: { nombre: true } } } },
        },
      },
    },
  });
  if (!plan) notFound();

  const avatar = getAvatarColors(plan.id);
  const sesiones = plan.sesiones.map((s) => ({
    id: s.id,
    nombre: s.posicionResponsable.nombre,
    titular: s.posicionResponsable.titularNombre,
    areaNombre: s.posicionResponsable.area.nombre,
    tipo: s.tipo,
    estado: s.estado,
    fecha: toIso(s.fecha),
    hora: s.hora ?? "",
    comentarios: s.comentarios ?? "",
    duracionMin: s.duracionMin,
  }));

  return (
    <div>
      <Link
        href="/onboarding/ingresos"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted-2 hover:text-brand-primary"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
        Nuevos ingresos
      </Link>

      <div className="mb-5 flex items-center gap-4 rounded-[16px] border border-border bg-surface p-5">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold" style={{ background: avatar.bg, color: avatar.col }}>
          {getInitials(plan.colaboradorNombre)}
        </span>
        <div>
          <h1 className="font-display text-[20px] font-bold text-brand-primary">{plan.colaboradorNombre}</h1>
          <p className="text-sm text-text-muted-2">
            {plan.posicion.nombre} · {plan.posicion.area.nombre} · ingreso {plan.fechaIngreso.toLocaleDateString("es-MX")}
          </p>
        </div>
      </div>

      <SeguimientoPlan sesiones={sesiones} />
    </div>
  );
}
