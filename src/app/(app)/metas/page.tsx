import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentCiclo, sumPesos } from "@/lib/metas";
import { getMetasForUser } from "@/lib/metas-server";
import { MetaCard } from "@/components/meta-card";
import { NuevaMetaButton } from "@/components/nueva-meta-button";
import { SubmitMetasButton } from "@/components/submit-metas-button";

export default async function MetasPage() {
  const session = await auth();
  const ciclo = getCurrentCiclo();
  const mesActual = new Date().getUTCMonth() + 1;

  const [user, metas] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session!.user.id }, include: { manager: true } }),
    getMetasForUser(session!.user.id, ciclo),
  ]);

  const total = sumPesos(metas);
  const hasDrafts = metas.some((m) => m.estado === "BORRADOR");
  const hasApproved = metas.some((m) => m.estado === "APROBADA");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[23px] font-bold text-brand-primary">Gestión de Metas</h1>
          <p className="mt-1 text-[14.5px] text-text-muted">Ciclo {ciclo}</p>
        </div>
        {!hasApproved && <NuevaMetaButton />}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-[14px] border border-border bg-surface p-5">
        <div className="min-w-[220px] flex-1">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-semibold text-text-secondary">Peso capturado</span>
            <span
              className={`font-display text-base font-extrabold ${
                total === 100 ? "text-success" : total > 100 ? "text-danger" : "text-brand-primary"
              }`}
            >
              {total}%
            </span>
          </div>
          <div className="h-[9px] overflow-hidden rounded-full bg-divider">
            <div
              className={`h-full rounded-full ${
                total === 100 ? "bg-success" : total > 100 ? "bg-danger" : "bg-brand-accent"
              }`}
              style={{ width: `${Math.min(total, 100)}%` }}
            />
          </div>
        </div>
        {hasDrafts && (
          <SubmitMetasButton ciclo={ciclo} disabled={total !== 100} jefeName={user.manager?.name ?? null} />
        )}
      </div>

      {hasApproved && (
        <div className="mb-6 rounded-[11px] border border-success-bg bg-success-bg px-4 py-3 text-sm text-success">
          Ya tienes metas aprobadas y bloqueadas para este ciclo — no se pueden agregar metas nuevas.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {metas.length === 0 && (
          <p className="py-10 text-center text-sm text-text-muted-3">
            Aún no capturas metas para este ciclo.
          </p>
        )}
        {metas.map((m) => (
          <MetaCard
            key={m.id}
            meta={m}
            editable={m.estado === "BORRADOR"}
            canRecordAvance={m.estado === "APROBADA"}
            mesActual={mesActual}
          />
        ))}
      </div>
    </div>
  );
}
