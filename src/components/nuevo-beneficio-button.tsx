"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast-provider";
import { fileToCompressedDataUrl } from "@/lib/image-client";
import { BENEFICIO_TIPOS, BENEFICIO_TIPO_META, BeneficioTipo, BENEFICIO_TITULO_MAX } from "@/lib/beneficios";

export function NuevoBeneficioButton() {
  const router = useRouter();
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<BeneficioTipo>("BENEFICIO");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [vigencia, setVigencia] = useState("");
  const [enlace, setEnlace] = useState("");
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
    const res = await fetch("/api/beneficios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, titulo, descripcion, vigencia, enlace, imageData }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo publicar el beneficio.");
      return;
    }
    showToast("Beneficio publicado");
    setOpen(false);
    setTitulo("");
    setDescripcion("");
    setVigencia("");
    setEnlace("");
    setImageData(null);
    setTipo("BENEFICIO");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[10px] bg-brand-accent px-5 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(74,136,250,.28)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nuevo beneficio
      </button>

      {open && (
        <Modal title="Nuevo beneficio" subtitle="Se mostrará en el catálogo de Beneficios" onClose={() => setOpen(false)} maxWidth="560px">
          <form onSubmit={handleSubmit}>
            <label className="mb-2 block text-sm font-semibold text-text-secondary">Tipo</label>
            <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BENEFICIO_TIPOS.map((t) => {
                const active = tipo === t;
                const m = BENEFICIO_TIPO_META[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`flex flex-col items-center gap-1 rounded-[11px] border-[1.5px] px-2 py-3 text-center transition-colors ${
                      active ? "border-brand-accent bg-vacation-bg" : "border-divider bg-surface"
                    }`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg text-base" style={{ background: m.bg, color: m.text }}>
                      {m.icon}
                    </span>
                    <span className="text-[11px] font-bold leading-tight text-brand-primary">{m.label}</span>
                  </button>
                );
              })}
            </div>

            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              maxLength={BENEFICIO_TITULO_MAX}
              placeholder="Ej. 15% de descuento en gimnasios Smart Fit"
              className="mb-4 w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
            />

            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
              rows={4}
              placeholder="¿En qué consiste, cómo se usa y quién puede aprovecharlo?"
              className="mb-4 w-full resize-y rounded-[9px] border-[1.5px] border-border-input px-3.5 py-3 text-sm text-brand-primary outline-none focus:border-brand-accent"
            />

            <div className="mb-4 flex gap-3">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
                  Vigencia <span className="font-normal text-text-muted-3">(opcional)</span>
                </label>
                <input
                  value={vigencia}
                  onChange={(e) => setVigencia(e.target.value)}
                  placeholder="Ej. Todo 2026"
                  className="w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
                  Enlace <span className="font-normal text-text-muted-3">(opcional)</span>
                </label>
                <input
                  value={enlace}
                  onChange={(e) => setEnlace(e.target.value)}
                  type="url"
                  placeholder="https://…"
                  className="w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
                />
              </div>
            </div>

            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
              Imagen <span className="font-normal text-text-muted-3">(opcional)</span>
            </label>
            {imageData ? (
              <div className="mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageData} alt="Vista previa" className="max-h-48 w-full rounded-[11px] object-cover" />
                <button type="button" onClick={() => setImageData(null)} className="mt-2 text-xs font-semibold text-danger">
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
                onClick={() => setOpen(false)}
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
      )}
    </>
  );
}
