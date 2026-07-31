"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { MetaEstadoBadge } from "@/components/meta-estado-badge";
import { NuevaMetaModal } from "@/components/nueva-meta-modal";
import { MetaAvancePanel } from "@/components/meta-avance-panel";
import { META_CATEGORIA_LABELS, META_TIPO_LABELS, MetaCategoria, MetaTipo } from "@/lib/metas";

type MetaLike = {
  id: string;
  tipo: string;
  categoria: string;
  nombre: string;
  descripcion: string;
  peso: number;
  naturaleza: string;
  memoriaCalculo: string;
  valorAnterior: string | null;
  valor: string;
  unidad: string;
  alcanceParcial: boolean;
  fuente: string;
  estado: string;
  managerComment: string | null;
  avances?: { mes: number; avancePct: number; comentario: string | null }[];
};

export function MetaCard({
  meta,
  editable,
  canRecordAvance = false,
  mesActual,
}: {
  meta: MetaLike;
  editable: boolean;
  canRecordAvance?: boolean;
  mesActual?: number;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/metas/${meta.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || "No se pudo eliminar.", false);
      return;
    }
    showToast("Meta eliminada");
    router.refresh();
  }

  return (
    <div className="rounded-[14px] border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[220px] flex-1">
          <div className="text-[14.5px] font-bold text-brand-primary">{meta.nombre}</div>
          <div className="mt-0.5 text-xs text-text-muted-2">{meta.descripcion}</div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <span className="rounded-md bg-page px-2.5 py-1 text-xs font-semibold text-text-muted">
              {META_TIPO_LABELS[meta.tipo as MetaTipo] ?? meta.tipo}
            </span>
            <span className="rounded-md bg-page px-2.5 py-1 text-xs font-semibold text-text-muted">
              {META_CATEGORIA_LABELS[meta.categoria as MetaCategoria] ?? meta.categoria}
            </span>
            <span className="rounded-md bg-page px-2.5 py-1 text-xs font-semibold text-text-muted">
              {meta.naturaleza === "CRECE" ? "Crece" : "Decrece"} · {meta.valor} {meta.unidad}
            </span>
            <MetaEstadoBadge estado={meta.estado} />
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-xl font-extrabold text-brand-primary">{meta.peso}%</div>
          <div className="text-[10.5px] uppercase tracking-wide text-text-muted-3">peso</div>
        </div>
      </div>

      {meta.managerComment && meta.estado === "BORRADOR" && (
        <div className="mt-3.5 rounded-[9px] bg-danger-bg px-3.5 py-2.5 text-xs text-danger">
          <b>Tu jefe pidió un ajuste:</b> {meta.managerComment}
        </div>
      )}

      {editable && (
        <div className="mt-3.5 flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="rounded-[9px] border-[1.5px] border-border-input bg-surface px-3.5 py-2 text-xs font-bold text-text-secondary"
          >
            Editar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-[9px] border-[1.5px] border-[#E4B9B4] bg-surface px-3.5 py-2 text-xs font-bold text-danger disabled:opacity-50"
          >
            {deleting ? "…" : "Eliminar"}
          </button>
        </div>
      )}

      {meta.estado === "APROBADA" && (
        <MetaAvancePanel
          metaId={meta.id}
          avances={meta.avances ?? []}
          canRecord={canRecordAvance}
          mesActual={mesActual ?? 1}
        />
      )}

      {editing && <NuevaMetaModal meta={meta} onClose={() => setEditing(false)} />}
    </div>
  );
}
