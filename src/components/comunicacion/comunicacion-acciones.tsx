"use client";

import { useState } from "react";
import { NuevaPublicacionModal } from "@/components/nueva-publicacion-modal";
import { NuevoEventoModal } from "@/components/comunicacion/nuevo-evento-modal";
import { NuevaEncuestaModal } from "@/components/comunicacion/nueva-encuesta-modal";
import { ReconocerModal } from "@/components/comunicacion/reconocer-modal";

type Colega = { id: string; name: string; area: string | null };
type Which = "post" | "evento" | "encuesta" | "reconocer" | null;

export function ComunicacionAcciones({ isHR, colegas }: { isHR: boolean; colegas: Colega[] }) {
  const [open, setOpen] = useState<Which>(null);

  const secondaryCls =
    "flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-border-input bg-surface px-4 py-2.5 text-sm font-bold text-text-secondary hover:border-brand-accent";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setOpen("reconocer")}
          className="flex items-center gap-1.5 rounded-[10px] bg-brand-accent px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(74,136,250,.28)]"
        >
          ⭐ Reconocer
        </button>
        {isHR && (
          <>
            <button onClick={() => setOpen("post")} className={secondaryCls}>📢 Publicación</button>
            <button onClick={() => setOpen("evento")} className={secondaryCls}>📅 Evento</button>
            <button onClick={() => setOpen("encuesta")} className={secondaryCls}>📊 Encuesta</button>
          </>
        )}
      </div>

      {open === "post" && <NuevaPublicacionModal onClose={() => setOpen(null)} />}
      {open === "evento" && <NuevoEventoModal onClose={() => setOpen(null)} />}
      {open === "encuesta" && <NuevaEncuestaModal onClose={() => setOpen(null)} />}
      {open === "reconocer" && <ReconocerModal colegas={colegas} onClose={() => setOpen(null)} />}
    </>
  );
}
