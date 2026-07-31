import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOnboardingRole } from "@/lib/onboarding-server";
import { OnboardingTabs } from "@/components/onboarding/onboarding-tabs";

export const dynamic = "force-dynamic";

export default async function NotificacionesPage() {
  const role = await getOnboardingRole();
  if (role.role === "none") redirect("/dashboard");
  const isRh = role.role === "rh";

  const direcciones = await prisma.direccion.findMany({
    where: isRh ? {} : { id: role.role === "n1" ? role.areaId : undefined },
    orderBy: { nombre: "asc" },
    include: {
      gerenteN1: { select: { name: true } },
      posiciones: { include: { config: { select: { estado: true } } } },
    },
  });

  const conPendientes = direcciones
    .map((d) => ({
      ...d,
      pendientes: d.posiciones.filter((p) => (p.config?.estado ?? "none") !== "complete"),
    }))
    .filter((d) => d.pendientes.length > 0);

  return (
    <div>
      <h1 className="font-display text-[23px] font-bold text-brand-primary">Onboarding por posición</h1>
      <p className="mt-1 mb-1 text-sm text-text-muted">Notificaciones · lo que falta por configurar.</p>
      <OnboardingTabs active="/onboarding/notificaciones" isRh={isRh} />

      {conPendientes.length === 0 ? (
        <div className="rounded-[16px] border border-success bg-success-bg p-8 text-center">
          <p className="text-sm font-bold text-success">¡Todo al día! 🎉</p>
          <p className="mt-1 text-sm text-text-secondary">No hay posiciones pendientes de configurar.</p>
        </div>
      ) : isRh ? (
        <div className="flex flex-col gap-3">
          {conPendientes.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-[14px] border border-border bg-surface p-4">
              <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-brand-primary">{d.nombre}</div>
                <div className="text-xs text-text-muted-2">
                  {d.pendientes.length} posición{d.pendientes.length === 1 ? "" : "es"} sin completar
                  {d.gerenteN1?.name ? ` · responsable: ${d.gerenteN1.name}` : " · sin gerente asignado"}
                </div>
              </div>
              <span className="rounded-full bg-warning-bg px-3 py-1 text-xs font-bold text-warning">{d.pendientes.length} pendientes</span>
            </div>
          ))}
          <p className="mt-1 text-xs text-text-muted-3">
            En producción, estos avisos también se enviarán por correo y Microsoft Teams al gerente responsable.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[16px] border border-border bg-surface">
          {conPendientes[0].pendientes.map((p) => (
            <div key={p.id} className="flex items-center gap-3 border-b border-divider px-4 py-3 last:border-0">
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-brand-primary">{p.nombre}</div>
                <div className="text-[11px] text-text-muted-2">
                  {(p.config?.estado ?? "none") === "partial" ? "Configuración incompleta" : "Sin configurar"}
                </div>
              </div>
              <Link
                href={`/onboarding/posicion/${p.id}`}
                className="rounded-[8px] bg-brand-navy px-3.5 py-1.5 text-xs font-bold text-white hover:brightness-110"
              >
                Configurar
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
