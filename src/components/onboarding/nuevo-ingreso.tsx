"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { ESTADO_META } from "@/lib/onboarding-client";

type Pos = { id: string; nombre: string; areaNombre: string; estado: string; sesiones: number };
type PreviewSesion = { nombre: string; titular: string | null; areaNombre: string; tipo: string; duracionMin: number };
type Preview = { nombre: string; areaNombre: string; estado: string; sesiones: PreviewSesion[] };

export function NuevoIngreso({ posiciones }: { posiciones: Pos[] }) {
  const router = useRouter();
  const showToast = useToast();
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState<Pos | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resultados = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return posiciones
      .filter((p) => p.nombre.toLowerCase().includes(term) || p.areaNombre.toLowerCase().includes(term))
      .slice(0, 7);
  }, [posiciones, query]);

  async function elegir(p: Pos) {
    setSel(p);
    setQuery("");
    setPreview(null);
    setLoadingPrev(true);
    const res = await fetch(`/api/onboarding/positions/${p.id}`);
    setLoadingPrev(false);
    if (res.ok) setPreview(await res.json());
  }

  async function generar() {
    if (!sel || !nombre.trim() || !fecha) return;
    setSubmitting(true);
    const res = await fetch("/api/onboarding/hires", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ colaboradorNombre: nombre, posicionId: sel.id, fechaIngreso: fecha }),
    });
    const d = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) return showToast(d.error || "No se pudo generar el plan.", false);
    router.push(`/onboarding/plan/${d.id}`);
  }

  const totalMin = preview?.sesiones.reduce((n, s) => n + s.duracionMin, 0) ?? 0;

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
      {/* Formulario */}
      <div className="rounded-[16px] border border-border bg-surface p-6">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-text-muted-3">Nombre del colaborador</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
              className="mt-1.5 w-full rounded-[10px] border-[1.5px] border-border-input bg-surface px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-text-muted-3">Posición</label>
            {sel ? (
              <div className="mt-1.5 flex items-center gap-2 rounded-[10px] border-[1.5px] border-brand-accent bg-vacation-bg px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-brand-primary">{sel.nombre}</div>
                  <div className="text-xs text-text-muted-2">{sel.areaNombre}</div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${ESTADO_META[sel.estado].chip}`}>
                  {ESTADO_META[sel.estado].label}
                </span>
                <button onClick={() => { setSel(null); setPreview(null); }} className="text-text-muted-2 hover:text-danger" title="Cambiar">✕</button>
              </div>
            ) : (
              <>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por puesto o área…"
                  className="mt-1.5 w-full rounded-[10px] border-[1.5px] border-border-input bg-surface px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
                />
                {resultados.length > 0 && (
                  <div className="mt-1.5 overflow-hidden rounded-[10px] border border-border">
                    {resultados.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => elegir(p)}
                        className="flex w-full items-center gap-2 border-b border-divider px-3 py-2 text-left last:border-0 hover:bg-page"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-semibold text-brand-primary">{p.nombre}</div>
                          <div className="text-[11px] text-text-muted-2">{p.areaNombre}</div>
                        </div>
                        <span className="h-2 w-2 rounded-full" style={{ background: ESTADO_META[p.estado].dot }} />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-text-muted-3">Fecha de ingreso</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="mt-1.5 w-full rounded-[10px] border-[1.5px] border-border-input bg-surface px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
            />
          </div>

          <button
            onClick={generar}
            disabled={!sel || !nombre.trim() || !fecha || submitting}
            className="mt-1 rounded-[11px_11px_18px_11px] bg-brand-navy px-5 py-3 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? "Generando…" : "Generar plan de onboarding →"}
          </button>
        </div>
      </div>

      {/* Plan autogenerado */}
      <div className="rounded-[16px] border border-border bg-surface p-6">
        <div className="text-[10.5px] font-bold uppercase tracking-wide text-text-muted-3">Plan de onboarding · Automático</div>
        {!sel ? (
          <p className="py-10 text-center text-sm text-text-muted-3">Elige una posición para ver su plan.</p>
        ) : loadingPrev ? (
          <p className="py-10 text-center text-sm text-text-muted-3">Cargando plan…</p>
        ) : preview && preview.sesiones.length > 0 ? (
          <>
            <h2 className="font-display mt-1 text-[17px] font-bold text-brand-primary">{preview.nombre}</h2>
            <p className="text-xs text-text-muted-2">{preview.sesiones.length} sesiones · {totalMin} min en total</p>
            <div className="mt-4 flex flex-col gap-2">
              {preview.sesiones.map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-[10px] border border-divider px-3 py-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-page text-[11px] font-bold text-text-muted-2">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-brand-primary">{s.nombre}</div>
                    <div className="text-[11px] text-text-muted-2">{s.titular ? `${s.titular} · ` : ""}{s.areaNombre}</div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.tipo === "obligatoria" ? "bg-vacation-bg text-vacation-text" : "bg-warning-bg text-warning"}`}>
                    {s.tipo === "obligatoria" ? "Obligatoria" : "Recomendada"}
                  </span>
                  <span className="text-[11px] tabular-nums text-text-muted-2">{s.duracionMin}′</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-[10px] border border-warning bg-warning-bg px-3 py-3 text-xs font-semibold text-warning">
            Esta posición aún no tiene onboarding configurado. Puedes crear el ingreso, pero el plan estará vacío hasta que se configure la posición.
          </div>
        )}
      </div>
    </div>
  );
}
