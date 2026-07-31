"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast-provider";
import { fileToCompressedDataUrl } from "@/lib/image-client";
import { POST_TIPOS, POST_TIPO_LABELS, POST_TIPO_STYLES, PostTipo, POST_TITULO_MAX } from "@/lib/posts";

export function NuevaPublicacionModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const showToast = useToast();

  const [tipo, setTipo] = useState<PostTipo>("COMUNICADO");
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await fileToCompressedDataUrl(file);
      setImageData(compressed);
    } catch {
      setError("No se pudo procesar la imagen.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, titulo, cuerpo, imageData }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo publicar.");
      return;
    }

    showToast("Publicación creada");
    router.refresh();
    onClose();
  }

  return (
    <Modal title="Nueva publicación" subtitle="Se mostrará en el feed de Comunicación" onClose={onClose} maxWidth="560px">
      <form onSubmit={handleSubmit}>
        <label className="mb-2 block text-sm font-semibold text-text-secondary">Tipo</label>
        <div className="mb-5 grid grid-cols-2 gap-2">
          {POST_TIPOS.map((t) => {
            const active = tipo === t;
            const style = POST_TIPO_STYLES[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`flex items-center gap-2.5 rounded-[11px] border-[1.5px] px-4 py-3 text-left transition-colors ${
                  active ? "border-brand-accent bg-vacation-bg" : "border-divider bg-surface"
                }`}
              >
                <span
                  className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-base"
                  style={{ background: style.bg, color: style.text }}
                >
                  {style.icon}
                </span>
                <span className="text-sm font-bold text-brand-primary">{POST_TIPO_LABELS[t]}</span>
              </button>
            );
          })}
        </div>

        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Título</label>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={POST_TITULO_MAX}
          required
          placeholder="Ej. Nueva política de home office"
          className="mb-4 w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
        />

        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Contenido</label>
        <textarea
          value={cuerpo}
          onChange={(e) => setCuerpo(e.target.value)}
          rows={5}
          required
          placeholder="Escribe el comunicado o la noticia…"
          className="mb-4 w-full resize-y rounded-[9px] border-[1.5px] border-border-input px-3.5 py-3 text-sm text-brand-primary outline-none focus:border-brand-accent"
        />

        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
          Imagen <span className="font-normal text-text-muted-3">(opcional)</span>
        </label>
        {imageData ? (
          <div className="mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageData} alt="Vista previa" className="max-h-56 w-full rounded-[11px] object-cover" />
            <button
              type="button"
              onClick={() => setImageData(null)}
              className="mt-2 text-xs font-semibold text-danger"
            >
              Quitar imagen
            </button>
          </div>
        ) : (
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="mb-4 block w-full text-sm text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-page file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-primary"
          />
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
            {loading ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
