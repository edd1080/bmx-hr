"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast-provider";
import {
  ENCUESTA_PREGUNTA_MAX,
  ENCUESTA_OPCION_MAX,
  ENCUESTA_MAX_OPCIONES,
  ENCUESTA_MIN_OPCIONES,
} from "@/lib/comunicacion";

const inputCls =
  "w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent";

export function NuevaEncuestaModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const showToast = useToast();
  const [pregunta, setPregunta] = useState("");
  const [opciones, setOpciones] = useState<string[]>(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function setOpcion(i: number, v: string) {
    setOpciones((prev) => prev.map((o, idx) => (idx === i ? v : o)));
  }
  function addOpcion() {
    if (opciones.length < ENCUESTA_MAX_OPCIONES) setOpciones((prev) => [...prev, ""]);
  }
  function removeOpcion(i: number) {
    if (opciones.length > ENCUESTA_MIN_OPCIONES) setOpciones((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/encuestas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pregunta, opciones }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "No se pudo publicar la encuesta.");
      return;
    }
    showToast("Encuesta publicada");
    onClose();
    router.refresh();
  }

  return (
    <Modal title="Nueva encuesta" subtitle="Cada colaborador podrá votar una opción" onClose={onClose} maxWidth="540px">
      <form onSubmit={handleSubmit}>
        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Pregunta</label>
        <input value={pregunta} onChange={(e) => setPregunta(e.target.value)} required maxLength={ENCUESTA_PREGUNTA_MAX}
          placeholder="Ej. ¿Qué actividad prefieres para el próximo convivio?" className={`mb-4 ${inputCls}`} />

        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Opciones</label>
        <div className="mb-2 flex flex-col gap-2">
          {opciones.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={o} onChange={(e) => setOpcion(i, e.target.value)} maxLength={ENCUESTA_OPCION_MAX}
                placeholder={`Opción ${i + 1}`} className={inputCls} />
              {opciones.length > ENCUESTA_MIN_OPCIONES && (
                <button type="button" onClick={() => removeOpcion(i)} title="Quitar"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted-3 hover:bg-danger-bg hover:text-danger">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {opciones.length < ENCUESTA_MAX_OPCIONES && (
          <button type="button" onClick={addOpcion} className="mb-4 text-sm font-bold text-brand-accent hover:underline">
            + Agregar opción
          </button>
        )}

        {error && <p className="mb-4 mt-2 text-sm text-danger">{error}</p>}

        <div className="mt-2 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-[10px] border-[1.5px] border-border-input bg-surface py-3 text-sm font-bold text-text-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 rounded-[10px] bg-brand-accent py-3 text-sm font-bold text-white disabled:opacity-50">
            {loading ? "Publicando…" : "Publicar encuesta"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
