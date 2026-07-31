"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast-provider";
import {
  TICKET_AREAS,
  AREA_META,
  TICKET_PRIORIDADES,
  PRIORIDAD_META,
  TicketArea,
  TicketPrioridad,
  TICKET_ASUNTO_MAX,
} from "@/lib/tickets";

export function NuevoTicketButton() {
  const router = useRouter();
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const [area, setArea] = useState<TicketArea | "">("");
  const [asunto, setAsunto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState<TicketPrioridad>("MEDIA");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setArea("");
    setAsunto("");
    setDescripcion("");
    setPrioridad("MEDIA");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!area) {
      setError("Selecciona el área.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ area, asunto, descripcion, prioridad }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo crear el ticket.");
      return;
    }
    showToast("Ticket enviado");
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[10px] bg-brand-accent px-5 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(74,136,250,.28)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nuevo ticket
      </button>

      {open && (
        <Modal title="Nuevo ticket" subtitle="Levanta una solicitud a un área" onClose={() => setOpen(false)} maxWidth="560px">
          <form onSubmit={handleSubmit}>
            <label className="mb-2 block text-sm font-semibold text-text-secondary">Área</label>
            <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TICKET_AREAS.map((a) => {
                const active = area === a;
                const m = AREA_META[a];
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setArea(a)}
                    className={`flex flex-col items-center gap-1 rounded-[11px] border-[1.5px] px-2 py-3 text-center transition-colors ${
                      active ? "border-brand-accent bg-vacation-bg" : "border-divider bg-surface"
                    }`}
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
                      style={{ background: m.bg, color: m.text }}
                    >
                      {m.icon}
                    </span>
                    <span className="text-[11.5px] font-bold leading-tight text-brand-primary">{m.label}</span>
                  </button>
                );
              })}
            </div>

            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Asunto</label>
            <input
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              required
              maxLength={TICKET_ASUNTO_MAX}
              placeholder="Ej. No puedo acceder a mi correo"
              className="mb-4 w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
            />

            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
              rows={4}
              placeholder="Describe con detalle tu solicitud…"
              className="mb-4 w-full resize-y rounded-[9px] border-[1.5px] border-border-input px-3.5 py-3 text-sm text-brand-primary outline-none focus:border-brand-accent"
            />

            <label className="mb-2 block text-sm font-semibold text-text-secondary">Prioridad</label>
            <div className="mb-5 flex gap-2">
              {TICKET_PRIORIDADES.map((p) => {
                const active = prioridad === p;
                const m = PRIORIDAD_META[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrioridad(p)}
                    className={`flex-1 rounded-[10px] border-[1.5px] py-2 text-sm font-bold transition-colors ${
                      active ? "border-brand-accent" : "border-divider"
                    }`}
                    style={active ? { background: m.bg, color: m.text } : {}}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {error && <p className="mb-4 text-sm text-danger">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-[10px] border-[1.5px] border-border-input bg-surface py-3 text-sm font-bold text-text-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-[10px] bg-brand-accent py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {loading ? "Enviando…" : "Enviar ticket"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
