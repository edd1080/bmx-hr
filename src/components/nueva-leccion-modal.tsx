"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast-provider";
import {
  LESSON_TIPOS,
  LESSON_TIPO_LABELS,
  LESSON_TIPO_META,
  LessonTipo,
  LESSON_TITULO_MAX,
} from "@/lib/courses";

const TIPO_HINT: Record<LessonTipo, string> = {
  VIDEO: "Pega la liga de YouTube, Vimeo, Google Drive o un video (.mp4).",
  FORM: "Pega la liga del formulario (Google Forms, Microsoft Forms, etc.).",
  LINK: "Pega la liga a un documento o recurso externo.",
};

export function NuevaLeccionModal({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const router = useRouter();
  const showToast = useToast();

  const [tipo, setTipo] = useState<LessonTipo>("VIDEO");
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/courses/${courseId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, titulo, url, descripcion }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo agregar la lección.");
      return;
    }
    showToast("Lección agregada");
    router.refresh();
    onClose();
  }

  return (
    <Modal title="Agregar lección" onClose={onClose} maxWidth="540px">
      <form onSubmit={handleSubmit}>
        <label className="mb-2 block text-sm font-semibold text-text-secondary">Tipo de contenido</label>
        <div className="mb-5 grid grid-cols-3 gap-2">
          {LESSON_TIPOS.map((t) => {
            const active = tipo === t;
            const meta = LESSON_TIPO_META[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`flex flex-col items-center gap-1.5 rounded-[11px] border-[1.5px] px-2 py-3 transition-colors ${
                  active ? "border-brand-accent bg-vacation-bg" : "border-divider bg-surface"
                }`}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.icon}
                </span>
                <span className="text-xs font-bold text-brand-primary">{LESSON_TIPO_LABELS[t]}</span>
              </button>
            );
          })}
        </div>

        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Título</label>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={LESSON_TITULO_MAX}
          required
          placeholder="Ej. Módulo 1: Introducción"
          className="mb-4 w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
        />

        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Liga (URL)</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          type="url"
          placeholder="https://…"
          className="mb-1.5 w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
        />
        <p className="mb-4 text-xs text-text-muted-3">{TIPO_HINT[tipo]}</p>

        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
          Descripción <span className="font-normal text-text-muted-3">(opcional)</span>
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={2}
          className="mb-4 w-full resize-y rounded-[9px] border-[1.5px] border-border-input px-3.5 py-3 text-sm text-brand-primary outline-none focus:border-brand-accent"
        />

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
            {loading ? "Agregando…" : "Agregar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
