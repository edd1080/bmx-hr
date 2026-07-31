"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

// Botón compacto de eliminar reutilizable para las tarjetas del feed.
export function EliminarBoton({
  url,
  confirmMsg,
  okMsg,
  title = "Eliminar",
}: {
  url: string;
  confirmMsg: string;
  okMsg: string;
  title?: string;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(confirmMsg)) return;
    setLoading(true);
    const res = await fetch(url, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) return showToast("No se pudo eliminar.", false);
    showToast(okMsg);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title={title}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted-3 hover:bg-danger-bg hover:text-danger disabled:opacity-50"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      </svg>
    </button>
  );
}
