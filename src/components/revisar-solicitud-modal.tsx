"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast-provider";
import { TypeBadge } from "@/components/type-badge";
import { formatDateRange, formatDays } from "@/lib/leave";

export function RevisarSolicitudModal({
  request,
  onClose,
}: {
  request: {
    id: string;
    type: string;
    startDate: Date;
    endDate: Date;
    days: number;
    userName: string;
    departamento: string | null;
  };
  onClose: () => void;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState<"APPROVE" | "REJECT" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(action: "APPROVE" | "REJECT") {
    setError(null);
    setLoading(action);
    const res = await fetch(`/api/requests/${request.id}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, comment }),
    });
    setLoading(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo procesar la decisión.");
      return;
    }

    showToast(
      `Solicitud ${action === "APPROVE" ? "aprobada" : "rechazada"}`,
      action === "APPROVE"
    );
    router.refresh();
    onClose();
  }

  return (
    <Modal
      title="Revisar solicitud"
      subtitle={`${request.userName}${request.departamento ? ` · ${request.departamento}` : ""}`}
      onClose={onClose}
      maxWidth="460px"
    >
      <div className="mb-[18px] flex flex-wrap gap-2.5">
        <TypeBadge type={request.type} />
        <span className="rounded-lg bg-page px-3 py-1.5 text-sm font-semibold text-text-secondary">
          {formatDateRange(request.startDate, request.endDate)}
        </span>
        <span className="rounded-lg bg-page px-3 py-1.5 text-sm font-semibold text-text-secondary">
          {formatDays(request.days)} {request.days === 1 ? "día" : "días"}
        </span>
      </div>

      <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
        Comentario para el colaborador
      </label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Ej. Autorizado, buen descanso / Empalme con cierre de mes…"
        className="mb-5 w-full resize-y rounded-[9px] border-[1.5px] border-border-input px-3.5 py-3 text-sm text-brand-primary outline-none focus:border-brand-accent"
      />

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={() => decide("REJECT")}
          disabled={loading !== null}
          className="flex-1 rounded-[10px] border-[1.5px] border-[#E4B9B4] bg-surface py-3 text-sm font-bold text-danger disabled:opacity-50"
        >
          {loading === "REJECT" ? "…" : "Rechazar"}
        </button>
        <button
          onClick={() => decide("APPROVE")}
          disabled={loading !== null}
          className="flex-1 rounded-[10px] bg-success py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading === "APPROVE" ? "…" : "Aprobar"}
        </button>
      </div>
    </Modal>
  );
}
