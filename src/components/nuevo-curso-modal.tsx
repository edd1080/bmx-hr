"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast-provider";
import { fileToCompressedDataUrl } from "@/lib/image-client";
import { COURSE_TITULO_MAX, MODALIDADES, MODALIDAD_LABELS, MODALIDAD_STYLES, Modalidad } from "@/lib/courses";

export function NuevoCursoModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const showToast = useToast();

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("");
  const [modalidad, setModalidad] = useState<Modalidad>("VIRTUAL");
  const [horas, setHoras] = useState("");
  const [vigenciaMeses, setVigenciaMeses] = useState("");
  const [instructor, setInstructor] = useState("");
  const [sede, setSede] = useState("");
  const [cupo, setCupo] = useState("");
  const [fechaEvento, setFechaEvento] = useState("");
  const [coverData, setCoverData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCoverData(await fileToCompressedDataUrl(file, 900, 0.8));
    } catch {
      setError("No se pudo procesar la portada.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo,
        descripcion,
        categoria,
        coverData,
        modalidad,
        horas,
        vigenciaMeses,
        instructor,
        sede,
        cupo,
        fechaEvento,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo crear el curso.");
      return;
    }
    showToast("Curso creado");
    router.refresh();
    onClose();
  }

  return (
    <Modal title="Nuevo curso" subtitle="Después podrás agregar videos y formularios" onClose={onClose} maxWidth="560px">
      <form onSubmit={handleSubmit}>
        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Título del curso</label>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={COURSE_TITULO_MAX}
          required
          placeholder="Ej. Inducción a Seguridad e Higiene"
          className="mb-4 w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
        />

        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
          Categoría <span className="font-normal text-text-muted-3">(opcional)</span>
        </label>
        <input
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          placeholder="Ej. Seguridad, Ventas, Cultura"
          className="mb-4 w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
        />

        <label className="mb-2 block text-sm font-semibold text-text-secondary">Modalidad</label>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {MODALIDADES.map((m) => {
            const active = modalidad === m;
            const style = MODALIDAD_STYLES[m];
            return (
              <button
                key={m}
                type="button"
                onClick={() => setModalidad(m)}
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
                <span className="text-sm font-bold text-brand-primary">{MODALIDAD_LABELS[m]}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-4 flex gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
              Instructor <span className="font-normal text-text-muted-3">(opcional)</span>
            </label>
            <input
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              placeholder="Nombre del instructor"
              className="w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
            />
          </div>
          <div className="w-24">
            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
              Horas <span className="font-normal text-text-muted-3">(op.)</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
              placeholder="4"
              className="w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
            />
          </div>
          <div className="w-28">
            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
              Vigencia <span className="font-normal text-text-muted-3">(meses)</span>
            </label>
            <input
              type="number"
              min="0"
              value={vigenciaMeses}
              onChange={(e) => setVigenciaMeses(e.target.value)}
              placeholder="12"
              className="w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
            />
          </div>
        </div>

        {modalidad === "PRESENCIAL" && (
          <div className="mb-4 rounded-[11px] border border-warning-bg bg-warning-bg p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-warning">Datos del curso presencial</p>
            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Sede / Lugar</label>
            <input
              value={sede}
              onChange={(e) => setSede(e.target.value)}
              placeholder="Ej. Sala de capacitación, Planta CDMX"
              className="mb-3 w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Fecha y hora</label>
                <input
                  type="datetime-local"
                  value={fechaEvento}
                  onChange={(e) => setFechaEvento(e.target.value)}
                  className="w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
                />
              </div>
              <div className="w-28">
                <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Cupo</label>
                <input
                  type="number"
                  min="1"
                  value={cupo}
                  onChange={(e) => setCupo(e.target.value)}
                  placeholder="20"
                  className="w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
                />
              </div>
            </div>
          </div>
        )}

        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Descripción</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={4}
          required
          placeholder="¿De qué trata el curso y para quién es?"
          className="mb-4 w-full resize-y rounded-[9px] border-[1.5px] border-border-input px-3.5 py-3 text-sm text-brand-primary outline-none focus:border-brand-accent"
        />

        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
          Portada <span className="font-normal text-text-muted-3">(opcional)</span>
        </label>
        {coverData ? (
          <div className="mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverData} alt="Portada" className="max-h-44 w-full rounded-[11px] object-cover" />
            <button type="button" onClick={() => setCoverData(null)} className="mt-2 text-xs font-semibold text-danger">
              Quitar portada
            </button>
          </div>
        ) : (
          <input
            type="file"
            accept="image/*"
            onChange={handleCover}
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
            {loading ? "Creando…" : "Crear curso"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
