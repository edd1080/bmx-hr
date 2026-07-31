"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

type Sesion = {
  id: string;
  responsableId: string;
  nombre: string;
  titular: string | null;
  areaNombre: string;
  areaColor: string;
  objetivo: string;
  duracionMin: number;
  tipo: string;
  material: string;
  evidencia: string;
};
type CatItem = { id: string; nombre: string; titular: string | null; areaNombre: string; areaColor: string };
type Posicion = {
  id: string;
  nombre: string;
  areaNombre: string;
  areaColor: string;
  titular: string | null;
  reportaA: string | null;
  reportes: { nombre: string; titular: string | null }[];
};

export function ConfigurarPosicion({
  posicion,
  sesiones,
  catalogo,
  writable,
}: {
  posicion: Posicion;
  sesiones: Sesion[];
  catalogo: CatItem[];
  writable: boolean;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const selected = useMemo(() => new Map(sesiones.map((s) => [s.responsableId, s.id])), [sesiones]);

  const totalMin = sesiones.reduce((n, s) => n + s.duracionMin, 0);
  const faltaObjetivo = sesiones.some((s) => s.tipo === "obligatoria" && !s.objetivo.trim());

  const grupos = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = catalogo.filter((c) => {
      if (c.id === posicion.id) return false;
      if (!term) return true;
      return c.nombre.toLowerCase().includes(term) || c.areaNombre.toLowerCase().includes(term);
    });
    const byArea = new Map<string, { color: string; items: CatItem[] }>();
    for (const c of filtered) {
      const g = byArea.get(c.areaNombre) ?? { color: c.areaColor, items: [] };
      g.items.push(c);
      byArea.set(c.areaNombre, g);
    }
    return [...byArea.entries()];
  }, [catalogo, query, posicion.id]);

  async function toggle(responsableId: string) {
    if (!writable || busy) return;
    setBusy(true);
    const existingId = selected.get(responsableId);
    let res: Response;
    if (existingId) {
      res = await fetch(`/api/onboarding/sessions/${existingId}`, { method: "DELETE" });
    } else {
      res = await fetch("/api/onboarding/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posicionId: posicion.id, responsableId }),
      });
    }
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return showToast(d.error || "No se pudo actualizar.", false);
    }
    router.refresh();
  }

  async function saveDetail(id: string, data: Partial<Sesion>) {
    if (!writable || busy) return;
    setBusy(true);
    const res = await fetch(`/api/onboarding/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return showToast(d.error || "No se pudo guardar.", false);
    }
    setEditing(null);
    showToast("Sesión actualizada");
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_360px]">
      {/* ---- Canvas: contexto + selector ---- */}
      <div className="rounded-[16px] border border-border bg-surface p-5">
        <div className="mb-1 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: posicion.areaColor }} />
          <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted-3">{posicion.areaNombre}</span>
        </div>
        <h1 className="font-display text-[22px] font-bold text-brand-primary">{posicion.nombre}</h1>
        <p className="text-sm text-text-muted-2">
          {posicion.titular ? `Titular actual: ${posicion.titular}` : "Sin titular registrado"}
          {posicion.reportaA ? ` · Reporta a: ${posicion.reportaA}` : ""}
        </p>

        {!writable && (
          <div className="mt-3 rounded-[10px] border border-warning bg-warning-bg px-3 py-2 text-xs font-semibold text-warning">
            Solo lectura: esta posición pertenece a otra dirección. Puedes consultarla pero no editarla.
          </div>
        )}

        <div className="mt-5">
          <label className="text-[11px] font-bold uppercase tracking-wide text-text-muted-3">
            ¿Con qué posiciones debe reunirse un nuevo ingreso a este puesto?
          </label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar posición o área…"
            className="mt-2 w-full rounded-[10px] border-[1.5px] border-border-input bg-surface px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
          />
        </div>

        <div className="mt-4 flex max-h-[460px] flex-col gap-4 overflow-y-auto pr-1">
          {grupos.map(([area, g]) => (
            <div key={area}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: g.color }} />
                <span className="text-[10.5px] font-bold uppercase tracking-wide text-text-muted-2">{area}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {g.items.map((c) => {
                  const on = selected.has(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle(c.id)}
                      disabled={!writable || busy}
                      title={c.titular ?? undefined}
                      className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition disabled:opacity-60 ${
                        on
                          ? "border-brand-accent bg-vacation-bg text-brand-primary"
                          : "border-border-input bg-surface text-text-secondary hover:border-brand-accent"
                      }`}
                    >
                      {on ? "✓ " : "+ "}
                      {c.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Panel derecho: sesiones + validación + preview ---- */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-24">
        <div className="rounded-[16px] border border-border bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-bold text-brand-primary">
              Onboarding · {sesiones.length} sesión{sesiones.length === 1 ? "" : "es"}
            </h2>
            <span className="text-xs text-text-muted-2">{totalMin} min</span>
          </div>

          {faltaObjetivo && (
            <div className="mb-3 rounded-[10px] border border-warning bg-warning-bg px-3 py-2 text-xs font-semibold text-warning">
              ⚠ Hay sesiones obligatorias sin objetivo. Complétalas para marcar la posición como configurada.
            </div>
          )}

          {sesiones.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted-3">
              Aún no hay sesiones. Selecciona posiciones a la izquierda.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {sesiones.map((s, i) => (
                <div key={s.id} className="rounded-[10px] border border-border p-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-page text-[10px] font-bold text-text-muted-2">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-bold text-brand-primary">{s.nombre}</div>
                      <div className="text-[11px] text-text-muted-2">
                        {s.titular ? `${s.titular} · ` : ""}{s.areaNombre}
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.tipo === "obligatoria" ? "bg-vacation-bg text-vacation-text" : "bg-warning-bg text-warning"}`}>
                      {s.tipo === "obligatoria" ? "Obligatoria" : "Recomendada"}
                    </span>
                    {writable && (
                      <div className="flex gap-1">
                        <button onClick={() => setEditing(editing === s.id ? null : s.id)} title="Editar" className="text-text-muted-2 hover:text-brand-primary">✎</button>
                        <button onClick={() => toggle(s.responsableId)} disabled={busy} title="Quitar" className="text-text-muted-2 hover:text-danger">✕</button>
                      </div>
                    )}
                  </div>
                  {s.objetivo && editing !== s.id && (
                    <p className="mt-1.5 pl-7 text-[12px] text-text-secondary">{s.objetivo}</p>
                  )}

                  {editing === s.id && writable && <SesionEditor sesion={s} onSave={(data) => saveDetail(s.id, data)} busy={busy} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vista previa (lo que verá RH) */}
        {sesiones.length > 0 && (
          <div className="rounded-[16px] bg-brand-navy p-5 text-white">
            <div className="text-[10.5px] font-bold uppercase tracking-wide text-[#8FA3D4]">Vista previa · lo que verá RH</div>
            <div className="mt-1 font-display text-[15px] font-bold">Plan de {posicion.nombre}</div>
            <div className="mt-3 flex flex-col gap-1.5">
              {sesiones.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 text-[12.5px]">
                  <span className="text-[#8FA3D4]">{i + 1}.</span>
                  <span className="font-semibold">{s.nombre}</span>
                  <span className="ml-auto text-[#AFC4EC]">{s.duracionMin}′</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SesionEditor({ sesion, onSave, busy }: { sesion: Sesion; onSave: (data: Partial<Sesion>) => void; busy: boolean }) {
  const [objetivo, setObjetivo] = useState(sesion.objetivo);
  const [duracionMin, setDuracion] = useState(sesion.duracionMin);
  const [tipo, setTipo] = useState(sesion.tipo);
  const [evidencia, setEvidencia] = useState(sesion.evidencia);

  return (
    <div className="mt-3 flex flex-col gap-2.5 border-t border-divider pt-3">
      <div>
        <label className="text-[10.5px] font-bold uppercase tracking-wide text-text-muted-3">Objetivo</label>
        <textarea
          value={objetivo}
          onChange={(e) => setObjetivo(e.target.value)}
          rows={2}
          placeholder="¿Qué debe lograr esta sesión?"
          className="mt-1 w-full rounded-[9px] border-[1.5px] border-border-input bg-surface px-3 py-2 text-[13px] text-brand-primary outline-none focus:border-brand-accent"
        />
      </div>
      <div className="flex gap-2">
        <div className="w-24">
          <label className="text-[10.5px] font-bold uppercase tracking-wide text-text-muted-3">Duración</label>
          <input
            type="number"
            value={duracionMin}
            min={0}
            step={15}
            onChange={(e) => setDuracion(Number(e.target.value))}
            className="mt-1 w-full rounded-[9px] border-[1.5px] border-border-input bg-surface px-3 py-2 text-[13px] text-brand-primary outline-none focus:border-brand-accent"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10.5px] font-bold uppercase tracking-wide text-text-muted-3">Tipo</label>
          <div className="mt-1 flex rounded-[9px] border border-border-input p-0.5">
            {(["obligatoria", "recomendada"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`flex-1 rounded-[7px] px-2 py-1.5 text-[11.5px] font-bold ${tipo === t ? "bg-brand-accent text-white" : "text-text-muted-2"}`}
              >
                {t === "obligatoria" ? "Obligatoria" : "Recomendada"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="text-[10.5px] font-bold uppercase tracking-wide text-text-muted-3">Evidencia</label>
        <select
          value={evidencia}
          onChange={(e) => setEvidencia(e.target.value)}
          className="mt-1 w-full rounded-[9px] border-[1.5px] border-border-input bg-surface px-3 py-2 text-[13px] text-brand-primary outline-none focus:border-brand-accent"
        >
          <option value="ninguna">Ninguna</option>
          <option value="firma">Firma</option>
          <option value="checklist">Checklist</option>
          <option value="evaluacion">Evaluación</option>
        </select>
      </div>
      <button
        onClick={() => onSave({ objetivo, duracionMin, tipo, evidencia })}
        disabled={busy}
        className="self-start rounded-[9px] bg-brand-navy px-4 py-2 text-[12.5px] font-bold text-white hover:brightness-110 disabled:opacity-50"
      >
        Guardar sesión
      </button>
    </div>
  );
}
