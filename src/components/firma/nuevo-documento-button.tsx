"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast-provider";
import { fileToDataUrl } from "@/lib/image-client";
import {
  DOCUMENTO_TIPOS,
  DOCUMENTO_TIPO_META,
  DOCUMENTO_ALCANCES,
  ALCANCE_META,
  DOCUMENTO_TITULO_MAX,
  DOCUMENTO_ARCHIVO_MAX_CHARS,
  type DocumentoTipo,
  type DocumentoAlcance,
} from "@/lib/firma";

type Colaborador = { id: string; name: string; area: string | null };

export function NuevoDocumentoButton({
  areas,
  colaboradores,
}: {
  areas: string[];
  colaboradores: Colaborador[];
}) {
  const router = useRouter();
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<DocumentoTipo>("POLITICA");
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [vigencia, setVigencia] = useState("");
  const [alcance, setAlcance] = useState<DocumentoAlcance>("TODOS");
  const [area, setArea] = useState(areas[0] ?? "");
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState("");
  const [archivoData, setArchivoData] = useState<string | null>(null);
  const [archivoNombre, setArchivoNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const colFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return colaboradores;
    return colaboradores.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.area ?? "").toLowerCase().includes(q)
    );
  }, [busca, colaboradores]);

  function reset() {
    setTipo("POLITICA");
    setTitulo("");
    setCuerpo("");
    setVigencia("");
    setAlcance("TODOS");
    setArea(areas[0] ?? "");
    setSeleccion(new Set());
    setBusca("");
    setArchivoData(null);
    setArchivoNombre("");
    setError(null);
  }

  function toggle(id: string) {
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await fileToDataUrl(file);
      if (data.length > DOCUMENTO_ARCHIVO_MAX_CHARS) {
        setError("El archivo es demasiado grande (máx. ~4 MB).");
        return;
      }
      setArchivoData(data);
      setArchivoNombre(file.name);
      setError(null);
    } catch {
      setError("No se pudo leer el archivo.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/documentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo,
        titulo,
        cuerpo,
        vigencia,
        alcance,
        area: alcance === "AREA" ? area : "",
        destinatarios: alcance === "SELECCION" ? [...seleccion] : [],
        archivoData,
        archivoNombre,
      }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "No se pudo publicar el documento.");
      return;
    }
    showToast(`Documento publicado · ${data.destinatarios} destinatario(s)`);
    setOpen(false);
    reset();
    router.refresh();
  }

  const inputCls =
    "w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[10px] bg-brand-accent px-5 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(74,136,250,.28)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nuevo documento
      </button>

      {open && (
        <Modal
          title="Nuevo documento para firma"
          subtitle="Los destinatarios deberán leerlo y firmarlo con acuse auditable"
          onClose={() => setOpen(false)}
          maxWidth="620px"
        >
          <form onSubmit={handleSubmit}>
            <label className="mb-2 block text-sm font-semibold text-text-secondary">Tipo</label>
            <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DOCUMENTO_TIPOS.map((t) => {
                const active = tipo === t;
                const m = DOCUMENTO_TIPO_META[t];
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
              maxLength={DOCUMENTO_TITULO_MAX}
              placeholder="Ej. Política de uso de equipo de cómputo 2026"
              className={`mb-4 ${inputCls}`}
            />

            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Contenido</label>
            <textarea
              value={cuerpo}
              onChange={(e) => setCuerpo(e.target.value)}
              required
              rows={7}
              placeholder="Escribe aquí el texto del documento que el colaborador leerá antes de firmar."
              className="mb-4 w-full resize-y rounded-[9px] border-[1.5px] border-border-input px-3.5 py-3 text-sm leading-relaxed text-brand-primary outline-none focus:border-brand-accent"
            />

            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
              Archivo adjunto <span className="font-normal text-text-muted-3">(PDF o imagen, opcional)</span>
            </label>
            {archivoData ? (
              <div className="mb-4 flex items-center gap-2 rounded-[9px] border border-border bg-page px-3 py-2.5 text-sm">
                <span>📎</span>
                <span className="flex-1 truncate font-semibold text-brand-primary">{archivoNombre}</span>
                <button
                  type="button"
                  onClick={() => {
                    setArchivoData(null);
                    setArchivoNombre("");
                  }}
                  className="text-xs font-semibold text-danger"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={handleArchivo}
                className="mb-4 block w-full text-sm text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-page file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-primary"
              />
            )}

            <label className="mb-1.5 block text-sm font-semibold text-text-secondary">
              Vigencia <span className="font-normal text-text-muted-3">(opcional)</span>
            </label>
            <input
              value={vigencia}
              onChange={(e) => setVigencia(e.target.value)}
              placeholder="Ej. Vigente a partir del 1 de agosto de 2026"
              className={`mb-5 ${inputCls}`}
            />

            <label className="mb-2 block text-sm font-semibold text-text-secondary">¿A quién va dirigido?</label>
            <div className="mb-3 flex flex-col gap-2">
              {DOCUMENTO_ALCANCES.map((a) => {
                const active = alcance === a;
                const m = ALCANCE_META[a];
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAlcance(a)}
                    className={`flex items-start gap-3 rounded-[11px] border-[1.5px] px-3.5 py-2.5 text-left transition-colors ${
                      active ? "border-brand-accent bg-vacation-bg" : "border-divider bg-surface"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] ${
                        active ? "border-brand-accent" : "border-border-input"
                      }`}
                    >
                      {active && <span className="h-2 w-2 rounded-full bg-brand-accent" />}
                    </span>
                    <span>
                      <span className="block text-[13.5px] font-bold text-brand-primary">{m.label}</span>
                      <span className="block text-xs text-text-muted-2">{m.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {alcance === "AREA" && (
              <select value={area} onChange={(e) => setArea(e.target.value)} className={`mb-4 ${inputCls}`}>
                {areas.length === 0 && <option value="">— No hay áreas —</option>}
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            )}

            {alcance === "SELECCION" && (
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar colaborador…"
                    className={inputCls}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto rounded-[10px] border border-border">
                  {colFiltrados.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-text-muted-2">Sin resultados.</p>
                  ) : (
                    colFiltrados.map((c) => (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-2.5 border-b border-divider px-3 py-2 last:border-0 hover:bg-page"
                      >
                        <input type="checkbox" checked={seleccion.has(c.id)} onChange={() => toggle(c.id)} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-brand-primary">{c.name}</span>
                          {c.area && <span className="block truncate text-[11px] text-text-muted-2">{c.area}</span>}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <p className="mt-1.5 text-xs font-semibold text-text-muted-2">
                  {seleccion.size} seleccionado(s)
                </p>
              </div>
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
                {loading ? "Publicando…" : "Publicar y notificar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
