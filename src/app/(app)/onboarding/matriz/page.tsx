import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOnboardingRole } from "@/lib/onboarding-server";
import { OnboardingTabs } from "@/components/onboarding/onboarding-tabs";

export const dynamic = "force-dynamic";

export default async function MatrizPage() {
  const role = await getOnboardingRole();
  if (role.role !== "rh") redirect("/onboarding");

  // Todas las relaciones configuradas: posición (que ingresa) → posición responsable.
  const sesiones = await prisma.onboardingSession.findMany({
    include: {
      config: { select: { posicion: { select: { id: true, nombre: true, area: { select: { nombre: true, color: true } } } } } },
      posicionResponsable: { select: { id: true, nombre: true } },
    },
  });

  // Set de pares "origen→destino" para detectar reciprocidad.
  const pares = new Set(sesiones.map((s) => `${s.config.posicion.id}->${s.posicionResponsable.id}`));

  // Agrupar por posición origen.
  type Rel = { destinoId: string; destinoNombre: string; reciproco: boolean };
  const byOrigen = new Map<string, { nombre: string; area: string; color: string; rels: Rel[] }>();
  for (const s of sesiones) {
    const o = s.config.posicion;
    const g = byOrigen.get(o.id) ?? { nombre: o.nombre, area: o.area.nombre, color: o.area.color, rels: [] };
    g.rels.push({
      destinoId: s.posicionResponsable.id,
      destinoNombre: s.posicionResponsable.nombre,
      reciproco: pares.has(`${s.posicionResponsable.id}->${o.id}`),
    });
    byOrigen.set(o.id, g);
  }
  const filas = [...byOrigen.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const totalRel = sesiones.length;
  const faltantes = sesiones.filter((s) => !pares.has(`${s.posicionResponsable.id}->${s.config.posicion.id}`)).length;

  return (
    <div>
      <h1 className="font-display text-[23px] font-bold text-brand-primary">Onboarding por posición</h1>
      <p className="mt-1 mb-1 text-sm text-text-muted">Matriz de relaciones · auditoría de con quién se reúne cada posición.</p>
      <OnboardingTabs active="/onboarding/matriz" isRh />

      <div className="mb-5 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-vacation-bg px-3 py-1 font-bold text-vacation-text">{filas.length} posiciones con relaciones</span>
        <span className="rounded-full bg-page px-3 py-1 font-bold text-text-muted-2">{totalRel} relaciones en total</span>
        {faltantes > 0 && (
          <span className="rounded-full bg-warning-bg px-3 py-1 font-bold text-warning">{faltantes} sin recíproco</span>
        )}
      </div>

      {filas.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm font-semibold text-brand-primary">Todavía no hay relaciones configuradas</p>
          <p className="mt-1 text-sm text-text-muted-2">Configura el onboarding de alguna posición para verlas aquí.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[16px] border border-border bg-surface">
          {filas.map((f, i) => (
            <div key={i} className="flex flex-wrap items-start gap-3 border-b border-divider px-4 py-3 last:border-0">
              <div className="flex w-56 shrink-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: f.color }} />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-brand-primary">{f.nombre}</div>
                  <div className="truncate text-[11px] text-text-muted-2">{f.area}</div>
                </div>
              </div>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {f.rels.map((r, j) => (
                  <span
                    key={j}
                    title={r.reciproco ? "Relación recíproca" : "Sin recíproco (el otro puesto no se reúne con este)"}
                    className={`rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${
                      r.reciproco ? "border-border-input bg-page text-text-secondary" : "border-warning bg-warning-bg text-warning"
                    }`}
                  >
                    {r.destinoNombre}{!r.reciproco && " ⚠"}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {filas.length > 0 && (
        <p className="mt-3 text-xs text-text-muted-3">
          ⚠ marca relaciones sin recíproco: la posición responsable no tiene a esta en su propio onboarding.
          No es un error, solo una sugerencia de revisión.
        </p>
      )}
    </div>
  );
}
