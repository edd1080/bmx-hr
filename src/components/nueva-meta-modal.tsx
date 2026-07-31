"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast-provider";
import {
  META_TIPOS,
  META_TIPO_LABELS,
  META_CATEGORIAS,
  META_CATEGORIA_LABELS,
  META_NATURALEZAS,
  META_NATURALEZA_LABELS,
  META_PESOS,
  META_DESCRIPCION_MAX_LENGTH,
  MetaTipo,
  MetaCategoria,
  MetaNaturaleza,
} from "@/lib/metas";

type MetaLike = {
  id: string;
  tipo: string;
  categoria: string;
  nombre: string;
  descripcion: string;
  peso: number;
  naturaleza: string;
  memoriaCalculo: string;
  valorAnterior: string | null;
  valor: string;
  unidad: string;
  alcanceParcial: boolean;
  fuente: string;
};

export function NuevaMetaModal({ meta, onClose }: { meta?: MetaLike; onClose: () => void }) {
  const router = useRouter();
  const showToast = useToast();
  const isEdit = !!meta;

  const [tipo, setTipo] = useState<MetaTipo>((meta?.tipo as MetaTipo) ?? "ORGANICA");
  const [categoria, setCategoria] = useState<MetaCategoria>(
    (meta?.categoria as MetaCategoria) ?? "MAXIMIZAR"
  );
  const [nombre, setNombre] = useState(meta?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(meta?.descripcion ?? "");
  const [peso, setPeso] = useState<number>(meta?.peso ?? META_PESOS[3]);
  const [naturaleza, setNaturaleza] = useState<MetaNaturaleza>(
    (meta?.naturaleza as MetaNaturaleza) ?? "CRECE"
  );
  const [memoriaCalculo, setMemoriaCalculo] = useState(meta?.memoriaCalculo ?? "");
  const [valorAnterior, setValorAnterior] = useState(meta?.valorAnterior ?? "");
  const [valor, setValor] = useState(meta?.valor ?? "");
  const [unidad, setUnidad] = useState(meta?.unidad ?? "");
  const [alcanceParcial, setAlcanceParcial] = useState(meta?.alcanceParcial ?? true);
  const [fuente, setFuente] = useState(meta?.fuente ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const esProyecto = tipo === "PROYECTO";

  function onTipoChange(next: MetaTipo) {
    setTipo(next);
    if (next === "PROYECTO") {
      setAlcanceParcial(false);
      setNaturaleza("CRECE");
      setValorAnterior("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      tipo,
      categoria,
      nombre,
      descripcion,
      peso,
      naturaleza,
      memoriaCalculo,
      valorAnterior: esProyecto ? null : valorAnterior,
      valor,
      unidad,
      alcanceParcial: esProyecto ? false : alcanceParcial,
      fuente,
    };

    const res = await fetch(isEdit ? `/api/metas/${meta!.id}` : "/api/metas", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo guardar la meta.");
      return;
    }

    showToast(isEdit ? "Meta actualizada" : "Meta guardada como borrador");
    router.refresh();
    onClose();
  }

  return (
    <Modal
      title={isEdit ? "Editar meta" : "Nueva meta individual"}
      subtitle="Se guarda como borrador hasta que envíes todas tus metas a revisión"
      onClose={onClose}
      maxWidth="560px"
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4 grid grid-cols-2 gap-3.5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
              Tipo de meta
            </label>
            <select
              value={tipo}
              onChange={(e) => onTipoChange(e.target.value as MetaTipo)}
              className="w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
            >
              {META_TIPOS.map((t) => (
                <option key={t} value={t}>
                  {META_TIPO_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
              Categoría
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as MetaCategoria)}
              className="w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
            >
              {META_CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {META_CATEGORIA_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
          Nombre de la meta
        </label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          placeholder="Ej. Reducción de tiempo de respuesta SAC"
          className="mb-4 w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
        />

        <label className="mb-1.5 flex items-center justify-between text-sm font-semibold text-text-secondary">
          Descripción breve
          <span className="text-xs font-normal text-text-muted-3">
            {descripcion.length} / {META_DESCRIPCION_MAX_LENGTH}
          </span>
        </label>
        <input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={META_DESCRIPCION_MAX_LENGTH}
          required
          className="mb-4 w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
        />

        <div className="mb-4 grid grid-cols-3 gap-3.5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
              Naturaleza
            </label>
            <select
              value={naturaleza}
              disabled={esProyecto}
              onChange={(e) => setNaturaleza(e.target.value as MetaNaturaleza)}
              className="w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent disabled:bg-page disabled:text-text-muted-3"
            >
              {META_NATURALEZAS.map((n) => (
                <option key={n} value={n}>
                  {META_NATURALEZA_LABELS[n]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Peso</label>
            <select
              value={peso}
              onChange={(e) => setPeso(Number(e.target.value))}
              className="w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
            >
              {META_PESOS.map((p) => (
                <option key={p} value={p}>
                  {p}%
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Unidad</label>
            <input
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
              required
              placeholder="%, USD, cajas…"
              className="w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
            />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3.5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
              Valor año anterior{" "}
              {esProyecto && <span className="font-normal text-text-muted-3">(no aplica)</span>}
            </label>
            <input
              value={valorAnterior}
              disabled={esProyecto}
              onChange={(e) => setValorAnterior(e.target.value)}
              className="w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent disabled:bg-page disabled:text-text-muted-3"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
              Valor objetivo
            </label>
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
              className="w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
            />
          </div>
        </div>

        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
          Memoria de cálculo
        </label>
        <textarea
          value={memoriaCalculo}
          onChange={(e) => setMemoriaCalculo(e.target.value)}
          rows={2}
          required
          placeholder="¿Cómo se va a obtener y validar el valor?"
          className="mb-4 w-full resize-y rounded-[9px] border-[1.5px] border-border-input px-3.5 py-3 text-sm text-brand-primary outline-none focus:border-brand-accent"
        />

        <div className="mb-4 flex items-end gap-3.5">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Fuente</label>
            <input
              value={fuente}
              onChange={(e) => setFuente(e.target.value)}
              required
              placeholder="Reporte o documento fuente"
              className="w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
            />
          </div>
          <label
            className={`flex items-center gap-2 pb-2.5 text-sm font-semibold ${
              esProyecto ? "text-text-muted-3" : "text-text-secondary"
            }`}
          >
            <input
              type="checkbox"
              checked={alcanceParcial}
              disabled={esProyecto}
              onChange={(e) => setAlcanceParcial(e.target.checked)}
              className="h-4 w-4"
            />
            Alcance parcial
          </label>
        </div>

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
            {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Guardar borrador"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
