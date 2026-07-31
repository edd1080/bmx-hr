"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { TICKET_ESTADOS, ESTADO_META, TicketEstado } from "@/lib/tickets";

export function TicketEstadoControl({ ticketId, estado }: { ticketId: string; estado: string }) {
  const router = useRouter();
  const showToast = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  async function cambiar(nuevo: TicketEstado) {
    if (nuevo === estado) return;
    setLoading(nuevo);
    const res = await fetch(`/api/tickets/${ticketId}/estado`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevo }),
    });
    setLoading(null);
    if (!res.ok) {
      showToast("No se pudo cambiar el estado.", false);
      return;
    }
    showToast(`Ticket marcado como ${ESTADO_META[nuevo].label}`);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted-3">
        Cambiar estado
      </div>
      <div className="flex flex-wrap gap-2">
        {TICKET_ESTADOS.map((e) => {
          const active = e === estado;
          const m = ESTADO_META[e];
          return (
            <button
              key={e}
              onClick={() => cambiar(e)}
              disabled={active || loading !== null}
              className={`rounded-[9px] border-[1.5px] px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-60 ${
                active ? "border-transparent" : "border-border-input hover:border-brand-accent"
              }`}
              style={active ? { background: m.bg, color: m.text } : {}}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
