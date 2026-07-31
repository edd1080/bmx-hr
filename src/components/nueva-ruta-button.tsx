"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast-provider";

export function NuevaRutaButton({ puestos }: { puestos: string[] }) {
  const router = useRouter();
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [puesto, setPuesto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/rutas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, puesto, descripcion }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo crear la ruta.");
      return;
    }
    showToast("Ruta creada");
    setNombre("");
    setPuesto("");
    setDescripcion("");
    setOpen(false);
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
        Nueva ruta
      </button>

      {open && (
        <Modal title="Nueva ruta de aprendizaje" subtitle="Cursos requeridos por puesto" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit}>
            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Nombre de la ruta</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Ej. Inducción para Ventas"
              className="mb-4 w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
            />

            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Puesto</label>
            <input
              value={puesto}
              onChange={(e) => setPuesto(e.target.value)}
              required
              list="puestos-list"
              placeholder="Escribe o elige un puesto"
              className="mb-1 w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
            />
            <datalist id="puestos-list">
              {puestos.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <p className="mb-4 text-xs text-text-muted-3">
              Se aplica a los colaboradores cuyo puesto coincida con este texto.
            </p>

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
                {loading ? "Creando…" : "Crear ruta"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
