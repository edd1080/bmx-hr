"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { PLAN_ESTADO_META } from "@/lib/onboarding-client";

type Sesion = {
  id: string;
  nombre: string;
  titular: string | null;
  areaNombre: string;
  tipo: string;
  estado: string;
  fecha: string;
  hora: string;
  comentarios: string;
  duracionMin: number;
};

const CICLO: Record<string, string> = { pendiente: "agendada", agendada: "realizada", realizada: "pendiente" };

export function SeguimientoPlan({ sesiones }: { sesiones: Sesion[] }) {
  const router = useRouter();
  const showToast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const total = sesiones.length;
  const realizadas = sesiones.filter((s) => s.estado === "realizada").length;
  const agendadas = sesiones.filter((s) => s.estado === "agendada").length;
  const pendientes = sesiones.filter((s) => s.estado === "pendiente").length;
  const pct = total ? Math.round((realizadas / total) * 100) : 0;

  async function patch(id: string, data: Record<string, unknown>) {
    setBusy(id);
    const res = await fetch(`/api/onboarding/hires/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return showToast(d.error || "No se pudo actualizar.", false);
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Strip de progreso */}
      <div className="rounded-[16px] border border-border bg-surface p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-bold text-brand-primary">Avance general</span>
          <span className="text-sm font-bold tabular-nums text-brand-primary">{realizadas} de {total} · {pct}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-divider">
          <div className="h-full rounded-full bg-brand-accent" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex gap-2">
          <span className="rounded-full bg-success-bg px-2.5 py-0.5 text-[11px] font-bold text-success">{realizadas} realizadas</span>
          <span className="rounded-full bg-vacation-bg px-2.5 py-0.5 text-[11px] font-bold text-vacation-text">{agendadas} agendadas</span>
          <span className="rounded-full bg-page px-2.5 py-0.5 text-[11px] font-bold text-text-muted-2">{pendientes} pendientes</span>
        </div>
      </div>

      {/* Tabla de sesiones */}
      <div className="overflow-hidden rounded-[16px] border border-border bg-surface">
        {sesiones.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-text-muted-3">
            Este plan no tiene sesiones (la posición no tenía onboarding configurado al generarlo).
          </p>
        ) : (
          sesiones.map((s, i) => {
            const meta = PLAN_ESTADO_META[s.estado];
            const open = openId === s.id;
            return (
              <div key={s.id} className="border-b border-divider last:border-0">
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-page text-[11px] font-bold text-text-muted-2">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-brand-primary">{s.nombre}</div>
                    <div className="text-[11px] text-text-muted-2">
                      {s.titular ? `${s.titular} · ` : ""}{s.areaNombre}
                      {s.fecha ? ` · ${s.fecha}${s.hora ? " " + s.hora : ""}` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => patch(s.id, { estado: CICLO[s.estado] })}
                    disabled={busy === s.id}
                    title="Cambiar estado"
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${meta.chip}`}
                  >
                    {meta.icon} {meta.label}
                  </button>
                  <button onClick={() => setOpenId(open ? null : s.id)} className="text-text-muted-2 hover:text-brand-primary" title="Detalle">
                    {open ? "▲" : "▾"}
                  </button>
                </div>
                {open && (
                  <div className="grid grid-cols-1 gap-3 border-t border-divider bg-page px-4 py-3 sm:grid-cols-3">
                    <div>
                      <label className="text-[10.5px] font-bold uppercase tracking-wide text-text-muted-3">Fecha</label>
                      <input
                        type="date"
                        defaultValue={s.fecha}
                        onBlur={(e) => e.target.value !== s.fecha && patch(s.id, { fecha: e.target.value || null })}
                        className="mt-1 w-full rounded-[9px] border-[1.5px] border-border-input bg-surface px-3 py-2 text-[13px] text-brand-primary outline-none focus:border-brand-accent"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-bold uppercase tracking-wide text-text-muted-3">Hora</label>
                      <input
                        type="time"
                        defaultValue={s.hora}
                        onBlur={(e) => e.target.value !== s.hora && patch(s.id, { hora: e.target.value })}
                        className="mt-1 w-full rounded-[9px] border-[1.5px] border-border-input bg-surface px-3 py-2 text-[13px] text-brand-primary outline-none focus:border-brand-accent"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-bold uppercase tracking-wide text-text-muted-3">Comentarios</label>
                      <input
                        defaultValue={s.comentarios}
                        placeholder="Notas de la sesión"
                        onBlur={(e) => e.target.value !== s.comentarios && patch(s.id, { comentarios: e.target.value })}
                        className="mt-1 w-full rounded-[9px] border-[1.5px] border-border-input bg-surface px-3 py-2 text-[13px] text-brand-primary outline-none focus:border-brand-accent"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
