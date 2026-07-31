"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export function DocumentoAcciones({
  documentoId,
  cerrado,
  redirectOnDelete,
}: {
  documentoId: string;
  cerrado: boolean;
  redirectOnDelete?: string;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [loading, setLoading] = useState(false);

  async function toggleCerrado() {
    setLoading(true);
    const res = await fetch(`/api/documentos/${documentoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cerrado: !cerrado }),
    });
    setLoading(false);
    if (!res.ok) return showToast("No se pudo actualizar.", false);
    showToast(cerrado ? "Documento reabierto" : "Documento cerrado (ya no admite firmas)");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este documento y todas sus firmas? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    const res = await fetch(`/api/documentos/${documentoId}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) return showToast("No se pudo eliminar.", false);
    showToast("Documento eliminado");
    if (redirectOnDelete) router.push(redirectOnDelete);
    else router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={toggleCerrado}
        disabled={loading}
        className="rounded-[9px] border-[1.5px] border-border-input bg-surface px-4 py-2 text-sm font-bold text-text-secondary hover:border-brand-accent disabled:opacity-50"
      >
        {cerrado ? "Reabrir firmas" : "Cerrar firmas"}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="rounded-[9px] border-[1.5px] border-danger-bg bg-danger-bg px-4 py-2 text-sm font-bold text-danger hover:brightness-95 disabled:opacity-50"
      >
        Eliminar
      </button>
    </div>
  );
}
