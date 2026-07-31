import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOnboardingRole } from "@/lib/onboarding-server";
import { getInitials, getAvatarColors } from "@/lib/avatar";
import { OnboardingTabs } from "@/components/onboarding/onboarding-tabs";

export const dynamic = "force-dynamic";

export default async function IngresosPage() {
  const role = await getOnboardingRole();
  if (role.role !== "rh") redirect("/onboarding");

  const ingresos = await prisma.nuevoIngreso.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      posicion: { include: { area: { select: { nombre: true } } } },
      sesiones: { select: { estado: true } },
    },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/onboarding" className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted-2 hover:text-brand-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
            Onboarding
          </Link>
          <h1 className="font-display text-[23px] font-bold text-brand-primary">Nuevos ingresos</h1>
          <p className="mt-0.5 text-sm text-text-muted">{ingresos.length} planes de onboarding</p>
        </div>
        <Link href="/onboarding/nuevo" className="rounded-[11px_11px_18px_11px] bg-brand-navy px-4 py-2.5 text-sm font-bold text-white hover:brightness-110">
          ＋ Nuevo ingreso
        </Link>
      </div>

      <OnboardingTabs active="/onboarding/ingresos" isRh />


      {ingresos.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm font-semibold text-brand-primary">Aún no hay ingresos registrados</p>
          <p className="mt-1 text-sm text-text-muted-2">Crea el primero con “＋ Nuevo ingreso”.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[16px] border border-border bg-surface">
          {ingresos.map((ing) => {
            const total = ing.sesiones.length;
            const done = ing.sesiones.filter((s) => s.estado === "realizada").length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            const av = getAvatarColors(ing.id);
            return (
              <Link key={ing.id} href={`/onboarding/plan/${ing.id}`} className="flex items-center gap-3 border-b border-divider px-4 py-3 last:border-0 hover:bg-page">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold" style={{ background: av.bg, color: av.col }}>
                  {getInitials(ing.colaboradorNombre)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-brand-primary">{ing.colaboradorNombre}</div>
                  <div className="truncate text-xs text-text-muted-2">{ing.posicion.nombre} · {ing.posicion.area.nombre}</div>
                </div>
                <div className="flex w-40 items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-divider">
                    <div className="h-full rounded-full bg-brand-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-12 text-right text-xs font-bold tabular-nums text-text-secondary">{done}/{total}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
