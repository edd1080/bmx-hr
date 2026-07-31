"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { getInitials, getAvatarColors } from "@/lib/avatar";
import { EliminarBoton } from "@/components/comunicacion/eliminar-boton";
import { RSVP_ESTADOS, RSVP_META, type RsvpEstado } from "@/lib/comunicacion";

export type EventoCardData = {
  id: string;
  titulo: string;
  descripcion: string;
  imageData: string | null;
  lugar: string | null;
  inicio: string;
  fin: string | null;
  authorId: string;
  authorName: string;
  counts: Record<RsvpEstado, number>;
  myEstado: RsvpEstado | null;
};

function fmtRango(inicioIso: string, finIso: string | null): string {
  const inicio = new Date(inicioIso);
  const fecha = inicio.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const horaIni = inicio.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  if (finIso) {
    const fin = new Date(finIso);
    const mismoDia = fin.toDateString() === inicio.toDateString();
    const horaFin = fin.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    if (mismoDia) return `${fecha} · ${horaIni} – ${horaFin}`;
    const fechaFin = fin.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
    return `${fecha} ${horaIni} → ${fechaFin} ${horaFin}`;
  }
  return `${fecha} · ${horaIni}`;
}

export function EventoCard({ evento, isHR }: { evento: EventoCardData; isHR: boolean }) {
  const router = useRouter();
  const showToast = useToast();
  const [estado, setEstado] = useState<RsvpEstado | null>(evento.myEstado);
  const [counts, setCounts] = useState(evento.counts);
  const [loading, setLoading] = useState<RsvpEstado | null>(null);
  const avatar = getAvatarColors(evento.authorId);

  async function rsvp(nuevo: RsvpEstado) {
    if (loading) return;
    setLoading(nuevo);
    const res = await fetch(`/api/eventos/${evento.id}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevo }),
    });
    setLoading(null);
    if (!res.ok) return showToast("No se pudo guardar tu respuesta.", false);

    // Ajuste optimista de los contadores.
    setCounts((prev) => {
      const next = { ...prev };
      if (estado) next[estado] = Math.max(0, next[estado] - 1);
      next[nuevo] = next[nuevo] + 1;
      return next;
    });
    setEstado(nuevo);
    router.refresh();
  }

  return (
    <article className="overflow-hidden rounded-[16px] border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold"
          style={{ background: avatar.bg, color: avatar.col }}
        >
          {getInitials(evento.authorName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-brand-primary">{evento.authorName}</div>
          <div className="text-xs text-text-muted-2">Evento</div>
        </div>
        <span className="rounded-full bg-tint-purple-bg px-3 py-1 text-[11px] font-bold text-tint-purple-fg">📅 Evento</span>
        {isHR && (
          <EliminarBoton
            url={`/api/eventos/${evento.id}`}
            confirmMsg="¿Eliminar este evento y sus confirmaciones?"
            okMsg="Evento eliminado"
          />
        )}
      </div>

      {evento.imageData && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={evento.imageData} alt={evento.titulo} className="max-h-[520px] w-full object-cover" />
      )}

      <div className="px-5 py-4">
        <h3 className="font-display text-[17px] font-bold text-brand-primary">{evento.titulo}</h3>

        <div className="mt-3 flex flex-col gap-1.5 rounded-[12px] bg-page px-4 py-3 text-[13px] font-semibold text-brand-primary">
          <div className="flex items-center gap-2">
            <span aria-hidden>🗓️</span>
            <span className="capitalize">{fmtRango(evento.inicio, evento.fin)}</span>
          </div>
          {evento.lugar && (
            <div className="flex items-center gap-2">
              <span aria-hidden>📍</span>
              <span>{evento.lugar}</span>
            </div>
          )}
        </div>

        <p className="mt-3 whitespace-pre-wrap text-[14.5px] leading-relaxed text-text-secondary">
          {evento.descripcion}
        </p>

        {/* Confirmación de asistencia */}
        <div className="mt-4">
          <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-text-muted-2">
            ¿Asistirás?
          </div>
          <div className="flex flex-wrap gap-2">
            {RSVP_ESTADOS.map((e) => {
              const m = RSVP_META[e];
              const active = estado === e;
              return (
                <button
                  key={e}
                  onClick={() => rsvp(e)}
                  disabled={!!loading}
                  className={`flex items-center gap-1.5 rounded-[10px] border-[1.5px] px-3.5 py-2 text-sm font-bold transition-colors disabled:opacity-60 ${
                    active ? "" : "border-divider bg-surface text-text-secondary hover:border-brand-accent"
                  }`}
                  style={active ? { background: m.bg, borderColor: m.text, color: m.text } : undefined}
                >
                  <span>{m.icon}</span>
                  {m.label}
                  <span className={`ml-1 rounded-full px-1.5 text-[11px] ${active ? "bg-surface" : "bg-page"}`}>
                    {counts[e]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
}
