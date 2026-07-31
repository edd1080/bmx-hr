"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export function EnrollButton({ courseId, enrolled }: { courseId: string; enrolled: boolean }) {
  const router = useRouter();
  const showToast = useToast();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/courses/${courseId}/enroll`, {
      method: enrolled ? "DELETE" : "POST",
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || "No se pudo procesar la inscripción.", false);
      return;
    }
    showToast(enrolled ? "Inscripción cancelada" : "¡Te inscribiste al curso!");
    router.refresh();
  }

  if (enrolled) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-success bg-success-bg px-5 py-2.5 text-sm font-bold text-success disabled:opacity-50"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        Inscrito — cancelar
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-2 rounded-[10px] bg-brand-accent px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(74,136,250,.28)] disabled:opacity-50"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
        <path d="M12 5v14M5 12h14" />
      </svg>
      {loading ? "Procesando…" : "Inscribirme"}
    </button>
  );
}
