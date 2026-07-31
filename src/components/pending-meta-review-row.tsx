"use client";

import { useState } from "react";
import { RevisarMetaModal } from "@/components/revisar-meta-modal";
import { getInitials, getAvatarColors } from "@/lib/avatar";
import { META_TIPO_LABELS, MetaTipo } from "@/lib/metas";

export function PendingMetaReviewRow({
  meta,
}: {
  meta: {
    id: string;
    nombre: string;
    descripcion: string;
    tipo: string;
    categoria: string;
    peso: number;
    naturaleza: string;
    valor: string;
    unidad: string;
    userId: string;
    userName: string;
    puesto: string | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const avatar = getAvatarColors(meta.userId);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3.5 rounded-[11px] border border-divider px-4 py-3.5">
        <span
          className="font-display flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: avatar.bg, color: avatar.col }}
        >
          {getInitials(meta.userName)}
        </span>
        <div className="min-w-[150px] flex-1">
          <div className="text-[14.5px] font-bold text-brand-primary">{meta.userName}</div>
          <div className="text-xs text-text-muted-2">{meta.puesto || "—"}</div>
        </div>
        <div className="min-w-[160px]">
          <div className="text-[13px] font-bold text-brand-primary">{meta.nombre}</div>
          <div className="text-xs text-text-muted-2">
            {META_TIPO_LABELS[meta.tipo as MetaTipo] ?? meta.tipo} · {meta.peso}%
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="ml-auto rounded-[9px] bg-brand-accent px-4 py-2 text-xs font-bold text-white"
        >
          Revisar
        </button>
      </div>

      {open && <RevisarMetaModal meta={meta} onClose={() => setOpen(false)} />}
    </>
  );
}
