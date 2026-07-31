import { redirect } from "next/navigation";
import { getOnboardingRole } from "@/lib/onboarding-server";
import { OnboardingTabs } from "@/components/onboarding/onboarding-tabs";
import { ImportOrganigramaForm } from "@/components/onboarding/import-organigrama-form";

export const dynamic = "force-dynamic";

export default async function ImportarOrganigramaPage() {
  const role = await getOnboardingRole();
  if (role.role !== "rh") redirect("/onboarding");

  return (
    <div>
      <h1 className="font-display text-[23px] font-bold text-brand-primary">Onboarding por posición</h1>
      <p className="mt-1 mb-1 text-sm text-text-muted">Importar organigrama · actualiza direcciones y posiciones.</p>
      <OnboardingTabs active="/onboarding/importar" isRh />

      <div className="rounded-[16px] border border-border bg-surface p-6">
        <h2 className="font-display text-[16px] font-bold text-brand-primary">Sube el organigrama (CSV o Excel)</h2>
        <p className="mt-1 text-sm text-text-muted">
          Columnas esperadas: <span className="font-mono text-xs">NOMBRE COMPLETO · PUESTO · Nivel de puesto · Departamento · Área · Sub-departamento · Jefe Inmediato · Posición de Jefe Inmediato</span>.
        </p>
        <div className="mt-3 rounded-[10px] border border-vacation-text/30 bg-vacation-bg px-3 py-2 text-xs text-vacation-text">
          Solo <b>agrega o actualiza</b> posiciones (nunca borra), así que <b>no se pierden</b> las configuraciones de onboarding ya hechas.
          Las direcciones y puestos se emparejan sin importar acentos ni mayúsculas para no duplicar.
        </div>
        <div className="mt-4">
          <ImportOrganigramaForm />
        </div>
      </div>
    </div>
  );
}
