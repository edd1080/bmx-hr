"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { getInitials, getAvatarColors } from "@/lib/avatar";
import { EliminarBoton } from "@/components/comunicacion/eliminar-boton";

export type EncuestaCardData = {
  id: string;
  pregunta: string;
  cerrada: boolean;
  authorId: string;
  authorName: string;
  totalVotos: number;
  myOpcionId: string | null;
  opciones: { id: string; texto: string; votos: number }[];
};

export function EncuestaCard({ encuesta, isHR }: { encuesta: EncuestaCardData; isHR: boolean }) {
  const router = useRouter();
  const showToast = useToast();
  const [loading, setLoading] = useState(false);
  const avatar = getAvatarColors(encuesta.authorId);

  const yaVoto = !!encuesta.myOpcionId;
  const mostrarResultados = yaVoto || encuesta.cerrada || isHR;

  async function votar(opcionId: string) {
    if (loading || yaVoto || encuesta.cerrada) return;
    setLoading(true);
    const res = await fetch(`/api/encuestas/${encuesta.id}/voto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opcionId }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return showToast(data.error || "No se pudo registrar tu voto.", false);
    }
    showToast("¡Voto registrado!");
    router.refresh();
  }

  async function toggleCerrada() {
    setLoading(true);
    const res = await fetch(`/api/encuestas/${encuesta.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cerrada: !encuesta.cerrada }),
    });
    setLoading(false);
    if (!res.ok) return showToast("No se pudo actualizar.", false);
    showToast(encuesta.cerrada ? "Encuesta reabierta" : "Encuesta cerrada");
    router.refresh();
  }

  return (
    <article className="overflow-hidden rounded-[16px] border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold"
          style={{ background: avatar.bg, color: avatar.col }}
        >
          {getInitials(encuesta.authorName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-brand-primary">{encuesta.authorName}</div>
          <div className="text-xs text-text-muted-2">Encuesta{encuesta.cerrada ? " · cerrada" : ""}</div>
        </div>
        <span className="rounded-full bg-teal-bg px-3 py-1 text-[11px] font-bold text-teal">📊 Encuesta</span>
        {isHR && (
          <EliminarBoton
            url={`/api/encuestas/${encuesta.id}`}
            confirmMsg="¿Eliminar esta encuesta y sus votos?"
            okMsg="Encuesta eliminada"
          />
        )}
      </div>

      <div className="px-5 py-4">
        <h3 className="font-display text-[17px] font-bold text-brand-primary">{encuesta.pregunta}</h3>

        <div className="mt-4 flex flex-col gap-2.5">
          {encuesta.opciones.map((o) => {
            const pct = encuesta.totalVotos > 0 ? Math.round((o.votos / encuesta.totalVotos) * 100) : 0;
            const esMia = encuesta.myOpcionId === o.id;

            if (!mostrarResultados) {
              return (
                <button
                  key={o.id}
                  onClick={() => votar(o.id)}
                  disabled={loading}
                  className="flex items-center rounded-[11px] border-[1.5px] border-divider bg-surface px-4 py-3 text-left text-sm font-semibold text-brand-primary transition-colors hover:border-brand-accent disabled:opacity-60"
                >
                  {o.texto}
                </button>
              );
            }

            return (
              <div
                key={o.id}
                className={`relative overflow-hidden rounded-[11px] border-[1.5px] px-4 py-3 ${
                  esMia ? "border-brand-accent" : "border-divider"
                }`}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-vacation-bg"
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
                <div className="relative flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-brand-primary">
                    {o.texto} {esMia && <span className="text-brand-accent">✓</span>}
                  </span>
                  <span className="shrink-0 font-bold text-text-secondary">
                    {pct}% · {o.votos}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-text-muted-2">
            {encuesta.totalVotos} {encuesta.totalVotos === 1 ? "voto" : "votos"}
            {!mostrarResultados && " · vota para ver los resultados"}
          </span>
          {isHR && (
            <button
              onClick={toggleCerrada}
              disabled={loading}
              className="text-xs font-bold text-brand-accent hover:underline disabled:opacity-50"
            >
              {encuesta.cerrada ? "Reabrir" : "Cerrar encuesta"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
