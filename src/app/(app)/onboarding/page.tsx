import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOnboardingRole, ESTADO_META } from "@/lib/onboarding-server";
import { OnboardingTabs } from "@/components/onboarding/onboarding-tabs";

export const dynamic = "force-dynamic";

function Kpi({ n, label, dark }: { n: number; label: string; dark?: boolean }) {
  return (
    <div className={`rounded-[14px] border p-4 ${dark ? "border-transparent bg-brand-navy text-white" : "border-border bg-surface"}`}>
      <div className={`font-display text-[30px] font-extrabold leading-none tabular-nums ${dark ? "text-white" : "text-brand-primary"}`}>{n}</div>
      <div className={`mt-1.5 text-[11.5px] font-semibold ${dark ? "text-[#AFC4EC]" : "text-text-muted"}`}>{label}</div>
    </div>
  );
}

export default async function OnboardingPage() {
  const role = await getOnboardingRole();
  if (role.role === "none") redirect("/dashboard");

  const [ingresosActivos, sesPend, sesReal] =
    role.role === "rh"
      ? await Promise.all([
          prisma.nuevoIngreso.count(),
          prisma.planSesion.count({ where: { estado: { not: "realizada" } } }),
          prisma.planSesion.count({ where: { estado: "realizada" } }),
        ])
      : [0, 0, 0];

  const direcciones = await prisma.direccion.findMany({
    where: role.role === "n1" ? { id: role.areaId } : {},
    orderBy: { nombre: "asc" },
    include: {
      posiciones: {
        orderBy: { headcount: "desc" },
        include: { config: { select: { estado: true, _count: { select: { sesiones: true } } } } },
      },
    },
  });

  const totalPos = direcciones.reduce((n, d) => n + d.posiciones.length, 0);
  const totalCompletas = direcciones.reduce(
    (n, d) => n + d.posiciones.filter((p) => p.config?.estado === "complete").length,
    0,
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[23px] font-bold text-brand-primary">
            Onboarding por posición
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {role.role === "rh"
              ? `${totalCompletas} de ${totalPos} posiciones con onboarding completo · ${direcciones.length} direcciones`
              : `Dirección ${role.areaNombre} · configura el onboarding de tus posiciones`}
          </p>
        </div>
        {role.role === "rh" && (
          <div className="flex items-center gap-2.5">
            <Link href="/onboarding/ingresos" className="rounded-[10px] border-[1.5px] border-border-input px-4 py-2.5 text-sm font-bold text-brand-primary hover:bg-page">
              Nuevos ingresos
            </Link>
            <Link href="/onboarding/nuevo" className="rounded-[11px_11px_18px_11px] bg-brand-navy px-4 py-2.5 text-sm font-bold text-white hover:brightness-110">
              ＋ Nuevo ingreso
            </Link>
          </div>
        )}
      </div>

      <OnboardingTabs active="/onboarding" isRh={role.role === "rh"} />

      {role.role === "rh" && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi n={ingresosActivos} label="Onboardings activos" />
          <Kpi n={sesPend} label="Sesiones pendientes" />
          <Kpi n={sesReal} label="Sesiones completadas" />
          <Kpi n={totalCompletas} label="Posiciones configuradas" dark />
        </div>
      )}

      <div className="flex flex-col gap-6">
        {direcciones.map((d) => {
          const completas = d.posiciones.filter((p) => p.config?.estado === "complete").length;
          const pct = d.posiciones.length ? Math.round((completas / d.posiciones.length) * 100) : 0;
          return (
            <section key={d.id} className="rounded-[16px] border border-border bg-surface p-5">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                <h2 className="font-display text-[16px] font-bold text-brand-primary">{d.nombre}</h2>
                <span className="text-xs text-text-muted-2">{d.posiciones.length} posiciones</span>
                <div className="ml-auto flex items-center gap-2">
                  <div className="h-2 w-28 overflow-hidden rounded-full bg-divider">
                    <div className="h-full rounded-full bg-brand-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold tabular-nums text-brand-primary">{pct}%</span>
                </div>
              </div>

              <div className="overflow-hidden rounded-[10px] border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-page">
                    <tr className="text-left text-[10.5px] uppercase tracking-wide text-text-muted-3">
                      <th className="px-3 py-2 font-bold">Posición</th>
                      <th className="px-3 py-2 font-bold">Titular actual</th>
                      <th className="px-3 py-2 text-center font-bold">Sesiones</th>
                      <th className="px-3 py-2 font-bold">Estado</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.posiciones.map((p) => {
                      const estado = p.config?.estado ?? "none";
                      const meta = ESTADO_META[estado];
                      return (
                        <tr key={p.id} className="border-t border-divider">
                          <td className="px-3 py-2 font-semibold text-brand-primary">{p.nombre}</td>
                          <td className="px-3 py-2 text-text-secondary">{p.titularNombre || "—"}</td>
                          <td className="px-3 py-2 text-center tabular-nums text-text-secondary">
                            {p.config?._count.sesiones ?? 0}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${meta.chip}`}>
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Link
                              href={`/onboarding/posicion/${p.id}`}
                              className="rounded-[8px] border border-border-input px-3 py-1 text-xs font-bold text-brand-primary hover:bg-page"
                            >
                              {estado === "none" ? "Configurar" : "Editar"}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
