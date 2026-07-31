"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

type Course = { id: string; titulo: string };

export function RutaCourseManager({
  rutaId,
  allCourses,
  currentIds,
}: {
  rutaId: string;
  allCourses: Course[];
  currentIds: string[];
}) {
  const router = useRouter();
  const showToast = useToast();
  const [sel, setSel] = useState("");
  const [loading, setLoading] = useState(false);

  const disponibles = allCourses.filter((c) => !currentIds.includes(c.id));

  async function add() {
    if (!sel) return;
    setLoading(true);
    const res = await fetch(`/api/rutas/${rutaId}/cursos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: sel }),
    });
    setLoading(false);
    if (!res.ok) return showToast("No se pudo agregar el curso.", false);
    setSel("");
    showToast("Curso agregado a la ruta");
    router.refresh();
  }

  async function remove(courseId: string) {
    const res = await fetch(`/api/rutas/${rutaId}/cursos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    if (!res.ok) return showToast("No se pudo quitar el curso.", false);
    showToast("Curso quitado de la ruta");
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-divider pt-3">
      <select
        value={sel}
        onChange={(e) => setSel(e.target.value)}
        className="flex-1 rounded-[9px] border-[1.5px] border-border-input px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-accent"
      >
        <option value="">Agregar curso a la ruta…</option>
        {disponibles.map((c) => (
          <option key={c.id} value={c.id}>
            {c.titulo}
          </option>
        ))}
      </select>
      <button
        onClick={add}
        disabled={!sel || loading}
        className="rounded-[9px] bg-brand-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        Agregar
      </button>
      {/* Botón oculto para exponer remove a los chips renderizados por el servidor */}
      <RemoveButtons currentIds={currentIds} onRemove={remove} allCourses={allCourses} />
    </div>
  );
}

function RemoveButtons({
  currentIds,
  allCourses,
  onRemove,
}: {
  currentIds: string[];
  allCourses: Course[];
  onRemove: (id: string) => void;
}) {
  if (currentIds.length === 0) return null;
  return (
    <div className="mt-2 flex w-full flex-wrap gap-2">
      {currentIds.map((id) => {
        const c = allCourses.find((x) => x.id === id);
        if (!c) return null;
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1.5 rounded-full bg-page px-3 py-1 text-[12px] font-semibold text-brand-primary"
          >
            {c.titulo}
            <button
              onClick={() => onRemove(id)}
              className="text-text-muted-3 hover:text-danger"
              title="Quitar de la ruta"
            >
              ✕
            </button>
          </span>
        );
      })}
    </div>
  );
}
