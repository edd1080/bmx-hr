"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast-provider";
import { availableLeaveTypes, isSingleDayLeaveType, LEAVE_TYPE_LABELS, LeaveType } from "@/lib/leave";

const TYPE_META: Record<LeaveType, { icon: string; desc: string }> = {
  VACATION: { icon: "🌴", desc: "Días de descanso continuos" },
  EARLY_FRIDAY: { icon: "🕓", desc: "Salida anticipada el viernes — solo administrativos" },
  HALF_DAY: { icon: "½", desc: "4 horas libres — operativos y administrativos" },
};

export function NuevaSolicitudModal({
  category,
  jefeName,
  onClose,
}: {
  category: string;
  jefeName: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const showToast = useToast();
  const types = availableLeaveTypes(category);

  const [type, setType] = useState<LeaveType>(types[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const singleDay = isSingleDayLeaveType(type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (singleDay && type === "EARLY_FRIDAY") {
      const dow = new Date(startDate + "T00:00:00Z").getUTCDay();
      if (dow !== 5) {
        setError("Early Friday solo se puede solicitar para un día viernes.");
        return;
      }
    }

    setLoading(true);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        startDate,
        endDate: singleDay ? startDate : endDate,
        reason,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo enviar la solicitud.");
      return;
    }

    showToast(`Solicitud enviada${jefeName ? ` a ${jefeName}` : ""}`);
    router.refresh();
    onClose();
  }

  return (
    <Modal title="Nueva solicitud" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label className="mb-2 block text-sm font-semibold text-text-secondary">
          Tipo de solicitud
        </label>
        <div className="mb-5 flex flex-col gap-2">
          {types.map((t) => {
            const active = type === t;
            const meta = TYPE_META[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex w-full items-center gap-3 rounded-[11px] border-[1.5px] px-4 py-3 text-left transition-colors ${
                  active ? "border-brand-accent bg-vacation-bg" : "border-divider bg-surface"
                }`}
              >
                <span
                  className={`font-display flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg text-base font-extrabold ${
                    active ? "bg-vacation-bg text-vacation-text" : "bg-page text-text-muted"
                  }`}
                >
                  {meta.icon}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-brand-primary">
                    {LEAVE_TYPE_LABELS[t]}
                  </span>
                  <span className="block text-xs text-text-muted-2">{meta.desc}</span>
                </span>
                <span
                  className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                    active ? "border-brand-accent bg-brand-accent" : "border-[#CBD3E0] bg-surface"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="mb-5 flex gap-3.5">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
              {singleDay ? "Fecha" : "Fecha inicio"}
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
            />
          </div>
          {!singleDay && (
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
                Fecha fin
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
              />
            </div>
          )}
        </div>

        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
          Motivo o comentario <span className="font-normal text-text-muted-3">(opcional)</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Añade contexto para tu jefe inmediato…"
          className="mb-2 w-full resize-y rounded-[9px] border-[1.5px] border-border-input px-3.5 py-3 text-sm text-brand-primary outline-none focus:border-brand-accent"
        />

        {jefeName && (
          <div className="mb-5 mt-3 flex items-center gap-2 rounded-[9px] bg-page px-3.5 py-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A88FA" strokeWidth="2" className="shrink-0">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16h.01" />
            </svg>
            <span className="text-xs text-text-muted">
              Se enviará automáticamente a <b className="text-brand-primary">{jefeName}</b> para
              aprobación.
            </span>
          </div>
        )}

        {error && <p className="mb-4 text-sm text-danger">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[10px] border-[1.5px] border-border-input bg-surface py-3 text-sm font-bold text-text-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-[10px] bg-brand-accent py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? "Enviando…" : "Enviar solicitud"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
