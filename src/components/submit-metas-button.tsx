"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export function SubmitMetasButton({
  ciclo,
  disabled,
  jefeName,
}: {
  ciclo: number;
  disabled: boolean;
  jefeName: string | null;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const res = await fetch("/api/metas/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ciclo }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || "No se pudieron enviar las metas.", false);
      return;
    }

    showToast(`Metas enviadas${jefeName ? ` a ${jefeName}` : ""}`);
    router.refresh();
  }

  return (
    <button
      onClick={handleSubmit}
      disabled={disabled || loading}
      className="shrink-0 rounded-[10px] bg-brand-accent px-5 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(74,136,250,.28)] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {loading ? "Enviando…" : "Enviar a revisión"}
    </button>
  );
}
