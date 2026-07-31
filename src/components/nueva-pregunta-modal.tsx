"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast-provider";
import { QUESTION_MAX_OPCIONES, QUESTION_TEXTO_MAX } from "@/lib/courses";

export function NuevaPreguntaModal({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const router = useRouter();
  const showToast = useToast();

  const [texto, setTexto] = useState("");
  const [opciones, setOpciones] = useState<string[]>(["", ""]);
  const [correcta, setCorrecta] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function setOpcion(i: number, value: string) {
    setOpciones((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }
  function addOpcion() {
    if (opciones.length < QUESTION_MAX_OPCIONES) setOpciones((prev) => [...prev, ""]);
  }
  function removeOpcion(i: number) {
    if (opciones.length <= 2) return;
    setOpciones((prev) => prev.filter((_, idx) => idx !== i));
    setCorrecta((c) => (c === i ? 0 : c > i ? c - 1 : c));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/courses/${courseId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto, opciones, correcta }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo agregar la pregunta.");
      return;
    }
    showToast("Pregunta agregada");
    router.refresh();
    onClose();
  }

  return (
    <Modal title="Agregar pregunta" subtitle="Examen del curso — opción múltiple" onClose={onClose} maxWidth="560px">
      <form onSubmit={handleSubmit}>
        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Pregunta</label>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={2}
          required
          maxLength={QUESTION_TEXTO_MAX}
          placeholder="Ej. ¿Cuál es el primer paso ante un derrame?"
          className="mb-4 w-full resize-y rounded-[9px] border-[1.5px] border-border-input px-3.5 py-3 text-sm text-brand-primary outline-none focus:border-brand-accent"
        />

        <label className="mb-2 block text-sm font-semibold text-text-secondary">
          Opciones <span className="font-normal text-text-muted-3">(marca la correcta)</span>
        </label>
        <div className="mb-3 flex flex-col gap-2">
          {opciones.map((op, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correcta"
                checked={correcta === i}
                onChange={() => setCorrecta(i)}
                className="h-4 w-4 shrink-0 accent-[#1F8A5B]"
                aria-label={`Marcar opción ${i + 1} como correcta`}
              />
              <input
                value={op}
                onChange={(e) => setOpcion(i, e.target.value)}
                required
                placeholder={`Opción ${i + 1}`}
                className="flex-1 rounded-[9px] border-[1.5px] border-border-input px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-accent"
              />
              {opciones.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOpcion(i)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted-3 hover:bg-danger-bg hover:text-danger"
                  aria-label="Quitar opción"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {opciones.length < QUESTION_MAX_OPCIONES && (
          <button
            type="button"
            onClick={addOpcion}
            className="mb-4 text-sm font-semibold text-brand-accent"
          >
            + Agregar opción
          </button>
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
            {loading ? "Guardando…" : "Agregar pregunta"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
