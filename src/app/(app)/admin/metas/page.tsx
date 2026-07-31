import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentCiclo } from "@/lib/metas";
import { getAllCompanyMetas } from "@/lib/metas-server";
import { MetaCard } from "@/components/meta-card";

export default async function AdminMetasPage() {
  const session = await auth();
  if (!session?.user?.isHR) redirect("/dashboard");

  const ciclo = getCurrentCiclo();
  const mesActual = new Date().getUTCMonth() + 1;
  const metas = await getAllCompanyMetas(ciclo);

  const byUser = new Map<string, typeof metas>();
  for (const m of metas) {
    const arr = byUser.get(m.userId) ?? [];
    arr.push(m);
    byUser.set(m.userId, arr);
  }

  const kpis = [
    { label: "Colaboradores con metas", value: byUser.size, col: "text-brand-primary" },
    { label: "Aprobadas", value: metas.filter((m) => m.estado === "APROBADA").length, col: "text-success" },
    { label: "En revisión", value: metas.filter((m) => m.estado === "EN_REVISION").length, col: "text-warning" },
    { label: "Borrador", value: metas.filter((m) => m.estado === "BORRADOR").length, col: "text-text-muted" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[23px] font-bold text-brand-primary">Metas de la compañía</h1>
        <p className="mt-1 text-[14.5px] text-text-muted">Ciclo {ciclo} — vista de solo lectura</p>
      </div>

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(185px,1fr))] gap-3.5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-[14px] border border-border bg-surface p-[17px]">
            <div className="mb-2 text-xs font-semibold leading-tight text-text-muted-2">{k.label}</div>
            <span className={`font-display text-[27px] font-extrabold leading-none ${k.col}`}>
              {k.value}
            </span>
          </div>
        ))}
      </div>

      {byUser.size === 0 && (
        <p className="py-10 text-center text-sm text-text-muted-3">
          Nadie ha capturado metas todavía para este ciclo.
        </p>
      )}

      {[...byUser.entries()].map(([uid, items]) => {
        const user = items[0]?.user;
        return (
          <div key={uid} className="mb-6">
            <h3 className="mb-2.5 text-[13.5px] font-bold text-text-secondary">
              {user?.name}
              <span className="ml-2 font-normal text-text-muted-3">
                {[user?.puesto, user?.area].filter(Boolean).join(" · ")}
              </span>
            </h3>
            <div className="flex flex-col gap-2.5">
              {items.map((m) => (
                <MetaCard key={m.id} meta={m} editable={false} mesActual={mesActual} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
