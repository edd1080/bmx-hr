"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { MESES_LABELS } from "@/lib/metas";

type Avance = { mes: number; avancePct: number; comentario: string | null };

export function MetaAvancePanel({
  metaId,
  avances,
  canRecord,
  mesActual,
}: {
  metaId: string;
  avances: Avance[];
  canRecord: boolean;
  mesActual: number;
}) {
  const router = useRouter();
  const showToast = useToast();
  const byMes = new Map(avances.map((a) => [a.mes, a]));
  const actual = byMes.get(mesActual);

  const [mes, setMes] = useState(mesActual);
  const [pct, setPct] = useState(actual?.avancePct ?? 0);
  const [comentario, setComentario] = useState(actual?.comentario ?? "");
  const [saving, setSaving] = useState(false);

  function selectMes(m: number) {
    setMes(m);
    const a = byMes.get(m);
    setPct(a?.avancePct ?? 0);
    setComentario(a?.comentario ?? "");
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/metas/${metaId}/avance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mes, avancePct: pct, comentario }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || "No se pudo guardar el avance.", false);
      return;
    }
    showToast("Avance guardado");
    router.refresh();
  }

  return (
    <div className="mt-4 rounded-[11px] border border-divider bg-page px-4 py-3.5">
      <div className="mb-3 text-xs font-bold uppercase tracking-wide text-text-muted-2">
        Avance mensual
      </div>

      <div className="mb-3 grid grid-cols-6 gap-1.5 sm:grid-cols-12">
        {MESES_LABELS.map((label, i) => {
          const m = i + 1;
          const a = byMes.get(m);
          return (
            <div key={m} className="flex flex-col items-center gap-1 rounded-lg bg-surface py-1.5">
              <span className="text-[9.5px] font-semibold text-text-muted-3">{label}</span>
              <span className={`text-[11.5px] font-bold ${a ? "text-brand-primary" : "text-text-muted-3"}`}>
                {a ? `${a.avancePct}%` : "—"}
              </span>
            </div>
          );
        })}
      </div>

      {canRecord && (
        <div className="flex flex-wrap items-end gap-2.5 border-t border-divider pt-3">
          <div>
            <label className="mb-1 block text-[10.5px] font-semibold text-text-muted-2">Mes</label>
            <select
              value={mes}
              onChange={(e) => selectMes(Number(e.target.value))}
              className="rounded-lg border-[1.5px] border-border-input px-2.5 py-1.5 text-[13px] text-brand-primary"
            >
              {MESES_LABELS.map((label, i) => (
                <option key={label} value={i + 1}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10.5px] font-semibold text-text-muted-2">Avance %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={pct}
              onChange={(e) => setPct(Number(e.target.value))}
              className="w-20 rounded-lg border-[1.5px] border-border-input px-2.5 py-1.5 text-[13px] text-brand-primary"
            />
          </div>
          <div className="min-w-[160px] flex-1">
            <label className="mb-1 block text-[10.5px] font-semibold text-text-muted-2">
              Comentario (opcional)
            </label>
            <input
              type="text"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Ej. avance conforme a lo planeado"
              className="w-full rounded-lg border-[1.5px] border-border-input px-2.5 py-1.5 text-[13px] text-brand-primary"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-brand-accent px-4 py-1.5 text-[13px] font-bold text-white disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      )}
    </div>
  );
}
