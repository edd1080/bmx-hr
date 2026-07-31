import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentCiclo } from "@/lib/metas";
import { getTeamMetas } from "@/lib/metas-server";
import { PendingMetaReviewRow } from "@/components/pending-meta-review-row";
import { MetaCard } from "@/components/meta-card";

export default async function EquipoMetasPage() {
  const session = await auth();
  const userId = session!.user.id;

  const team = await prisma.user.findMany({
    where: { managerId: userId },
    select: { id: true, name: true },
  });
  if (team.length === 0) {
    redirect("/dashboard");
  }

  const ciclo = getCurrentCiclo();
  const mesActual = new Date().getUTCMonth() + 1;
  const metas = await getTeamMetas(userId, ciclo);

  const pending = metas.filter((m) => m.estado === "EN_REVISION");
  const rest = metas.filter((m) => m.estado !== "EN_REVISION");

  const restByUser = new Map<string, typeof rest>();
  for (const m of rest) {
    const arr = restByUser.get(m.userId) ?? [];
    arr.push(m);
    restByUser.set(m.userId, arr);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[23px] font-bold text-brand-primary">Metas de mi equipo</h1>
        <p className="mt-1 text-[14.5px] text-text-muted">
          Ciclo {ciclo} · {team.length} colaboradores
        </p>
      </div>

      <div className="mb-6 rounded-[14px] border border-border bg-surface p-5">
        <h3 className="mb-4 font-display text-[16.5px] font-bold text-brand-primary">En revisión</h3>
        {pending.length === 0 ? (
          <p className="text-[13.5px] text-text-muted-3">No hay metas pendientes de tu revisión. ✓</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {pending.map((m) => (
              <PendingMetaReviewRow
                key={m.id}
                meta={{
                  id: m.id,
                  nombre: m.nombre,
                  descripcion: m.descripcion,
                  tipo: m.tipo,
                  categoria: m.categoria,
                  peso: m.peso,
                  naturaleza: m.naturaleza,
                  valor: m.valor,
                  unidad: m.unidad,
                  userId: m.user.id,
                  userName: m.user.name,
                  puesto: m.user.puesto,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {[...restByUser.entries()].map(([uid, items]) => {
        const name = items[0]?.user.name ?? "";
        return (
          <div key={uid} className="mb-5">
            <h3 className="mb-2.5 text-[13.5px] font-bold text-text-secondary">{name}</h3>
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
