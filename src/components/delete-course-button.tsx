"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export function DeleteCourseButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const showToast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Eliminar este curso y todas sus lecciones? No se puede deshacer.")) return;
    setLoading(true);
    const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
    if (!res.ok) {
      setLoading(false);
      showToast("No se pudo eliminar.", false);
      return;
    }
    showToast("Curso eliminado");
    router.push("/capacitacion");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-border-input px-4 py-2.5 text-sm font-bold text-danger hover:bg-danger-bg disabled:opacity-50"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      </svg>
      Eliminar curso
    </button>
  );
}
