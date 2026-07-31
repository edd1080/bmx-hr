"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast-provider";
import { META_CATEGORIA_LABELS, META_TIPO_LABELS, MetaCategoria, MetaTipo } from "@/lib/metas";

export function RevisarMetaModal({
  meta,
  onClose,
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
    userName: string;
    puesto: string | null;
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
    if (action === "REJECT" && !comment.trim()) {
      setError("Agrega un comentario para que el colaborador sepa qué corregir.");
      return;
    }
    setLoading(action);
    const res = await fetch(`/api/metas/${meta.id}/decision`, {
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
      action === "APPROVE" ? "Meta aprobada y bloqueada" : "Meta regresada al colaborador",
      action === "APPROVE"
    );
    router.refresh();
    onClose();
  }

  return (
    <Modal
      title="Revisar meta"
      subtitle={`${meta.userName}${meta.puesto ? ` · ${meta.puesto}` : ""}`}
      onClose={onClose}
      maxWidth="480px"
    >
      <div className="mb-4">
        <div className="text-[14.5px] font-bold text-brand-primary">{meta.nombre}</div>
        <div className="mt-0.5 text-sm text-text-muted-2">{meta.descripcion}</div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <span className="rounded-lg bg-page px-3 py-1.5 text-sm font-semibold text-text-secondary">
          {META_TIPO_LABELS[meta.tipo as MetaTipo] ?? meta.tipo}
        </span>
        <span className="rounded-lg bg-page px-3 py-1.5 text-sm font-semibold text-text-secondary">
          {META_CATEGORIA_LABELS[meta.categoria as MetaCategoria] ?? meta.categoria}
        </span>
        <span className="rounded-lg bg-page px-3 py-1.5 text-sm font-semibold text-text-secondary">
          {meta.peso}% del total
        </span>
        <span className="rounded-lg bg-page px-3 py-1.5 text-sm font-semibold text-text-secondary">
          {meta.naturaleza === "CRECE" ? "Crece" : "Decrece"} a {meta.valor} {meta.unidad}
        </span>
      </div>

      <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
        Comentario (obligatorio si rechazas)
      </label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Explica qué debe ajustar el colaborador…"
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
          {loading === "APPROVE" ? "…" : "Aprobar y bloquear"}
        </button>
      </div>
    </Modal>
  );
}
