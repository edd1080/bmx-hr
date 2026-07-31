"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast-provider";
import { fileToCompressedDataUrl } from "@/lib/image-client";
import { EVENTO_TITULO_MAX, EVENTO_LUGAR_MAX } from "@/lib/comunicacion";

const inputCls =
  "w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent";

export function NuevoEventoModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const showToast = useToast();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [lugar, setLugar] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImageData(await fileToCompressedDataUrl(file, 1100, 0.82));
    } catch {
      setError("No se pudo procesar la imagen.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, descripcion, lugar, inicio, fin, imageData }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "No se pudo publicar el evento.");
      return;
    }
    showToast("Evento publicado");
    onClose();
    router.refresh();
  }

  return (
    <Modal title="Nuevo evento" subtitle="Aparecerá en el feed y los colaboradores confirmarán asistencia" onClose={onClose} maxWidth="560px">
      <form onSubmit={handleSubmit}>
        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Título</label>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required maxLength={EVENTO_TITULO_MAX}
          placeholder="Ej. Posada de fin de año" className={`mb-4 ${inputCls}`} />

        <div className="mb-4 flex flex-wrap gap-3">
          <div className="min-w-[180px] flex-1">
            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Inicio</label>
            <input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} required className={inputCls} />
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
              Fin <span className="font-normal text-text-muted-3">(opcional)</span>
            </label>
            <input type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} className={inputCls} />
          </div>
        </div>

        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
          Lugar <span className="font-normal text-text-muted-3">(opcional)</span>
        </label>
        <input value={lugar} onChange={(e) => setLugar(e.target.value)} maxLength={EVENTO_LUGAR_MAX}
          placeholder="Ej. Terraza corporativo / Zoom" className={`mb-4 ${inputCls}`} />

        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Descripción</label>
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required rows={4}
          placeholder="¿De qué trata, quién está invitado, qué llevar?"
          className="mb-4 w-full resize-y rounded-[9px] border-[1.5px] border-border-input px-3.5 py-3 text-sm text-brand-primary outline-none focus:border-brand-accent" />

        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
          Imagen <span className="font-normal text-text-muted-3">(opcional)</span>
        </label>
        {imageData ? (
          <div className="mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageData} alt="Vista previa" className="max-h-48 w-full rounded-[11px] object-cover" />
            <button type="button" onClick={() => setImageData(null)} className="mt-2 text-xs font-semibold text-danger">Quitar imagen</button>
          </div>
        ) : (
          <input type="file" accept="image/*" onChange={handleImage}
            className="mb-4 block w-full text-sm text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-page file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-primary" />
        )}

        {error && <p className="mb-4 text-sm text-danger">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-[10px] border-[1.5px] border-border-input bg-surface py-3 text-sm font-bold text-text-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 rounded-[10px] bg-brand-accent py-3 text-sm font-bold text-white disabled:opacity-50">
            {loading ? "Publicando…" : "Publicar evento"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
