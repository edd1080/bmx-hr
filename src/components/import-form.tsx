"use client";

import { useRef, useState } from "react";

type FieldChange = { field: string; label: string; from: string; to: string };
type PlanRow = {
  rowNumber: number;
  codigo: string;
  nombre: string;
  action: "create" | "update" | "unchanged" | "error";
  changes: FieldChange[];
  warnings: string[];
  error?: string;
};
type MissingRow = { id: string; codigo: string; nombre: string };
type SyncPlan = {
  rows: PlanRow[];
  missing: MissingRow[];
  counts: {
    create: number;
    update: number;
    unchanged: number;
    error: number;
    missing: number;
    fileTotal: number;
  };
};

type ResultRow = {
  codigo: string;
  nombre: string;
  username?: string;
  tempPassword?: string;
  status: "creado" | "actualizado" | "reactivado" | "baja" | "error";
  error?: string;
};
type ApplyResponse = {
  results: ResultRow[];
  summary: {
    created: number;
    updated: number;
    unchanged: number;
    errors: number;
    deactivated: number;
    backupFile: string;
  };
};

type Stage = "idle" | "preview" | "done";

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-[10px] border px-3 py-2 text-center ${tone}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[11px] uppercase tracking-wide opacity-80">{label}</div>
    </div>
  );
}

export function ImportForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [plan, setPlan] = useState<SyncPlan | null>(null);
  const [applied, setApplied] = useState<ApplyResponse | null>(null);
  const [deactivateMissing, setDeactivateMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setFile(null);
    setStage("idle");
    setPlan(null);
    setApplied(null);
    setDeactivateMissing(false);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const f = fileRef.current?.files?.[0] ?? null;
    if (!f) {
      setError("Selecciona un archivo primero.");
      return;
    }
    setFile(f);

    const formData = new FormData();
    formData.append("file", f);

    setLoading(true);
    const res = await fetch("/api/admin/import/preview", { method: "POST", body: formData });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo analizar el archivo.");
      return;
    }
    const data = await res.json();
    setPlan(data.plan);
    setStage("preview");
  }

  async function handleApply() {
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("deactivateMissing", String(deactivateMissing));

    setLoading(true);
    const res = await fetch("/api/admin/import/apply", { method: "POST", body: formData });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo aplicar la importación.");
      return;
    }
    const data: ApplyResponse = await res.json();
    setApplied(data);
    setStage("done");
  }

  function downloadCredentials() {
    if (!applied) return;
    const rows = applied.results.filter((r) => r.tempPassword);
    if (rows.length === 0) return;
    const header = "Codigo,Nombre,Usuario,ContrasenaTemporal\n";
    const body = rows
      .map((r) => `${r.codigo},"${r.nombre}",${r.username},${r.tempPassword}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "credenciales_temporales.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---- Paso 3: resultados ----
  if (stage === "done" && applied) {
    const { summary } = applied;
    const hasCreds = applied.results.some((r) => r.tempPassword);
    return (
      <div className="space-y-4">
        <div className="rounded-[10px] border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-bold">✓ Importación aplicada.</p>
          <p className="mt-1">
            {summary.created} altas · {summary.updated} cambios · {summary.unchanged} sin cambios ·{" "}
            {summary.deactivated} bajas · {summary.errors} errores.
          </p>
          <p className="mt-1 text-xs opacity-80">
            Respaldo previo guardado como <span className="font-mono">{summary.backupFile}</span> en la
            carpeta <span className="font-mono">backups/</span>.
          </p>
        </div>

        {hasCreds && (
          <div className="flex items-center justify-between rounded-[10px] border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <span>Se crearon usuarios nuevos con contraseña temporal. Descárgalas para entregarlas.</span>
            <button
              onClick={downloadCredentials}
              className="rounded-[8px] border-[1.5px] border-amber-500 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100"
            >
              Descargar credenciales (CSV)
            </button>
          </div>
        )}

        <button
          onClick={reset}
          className="rounded-[9px] bg-brand-accent px-4 py-2 text-sm font-bold text-white hover:brightness-95"
        >
          Importar otro archivo
        </button>
      </div>
    );
  }

  // ---- Paso 2: vista previa ----
  if (stage === "preview" && plan) {
    const c = plan.counts;
    const creates = plan.rows.filter((r) => r.action === "create");
    const updates = plan.rows.filter((r) => r.action === "update");
    const errors = plan.rows.filter((r) => r.action === "error");

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          <StatCard label="Altas" value={c.create} tone="border-emerald-300 bg-emerald-50 text-emerald-800" />
          <StatCard label="Cambios" value={c.update} tone="border-amber-300 bg-amber-50 text-amber-800" />
          <StatCard label="Sin cambios" value={c.unchanged} tone="border-border bg-surface text-text-secondary" />
          <StatCard label="Bajas" value={c.missing} tone="border-rose-300 bg-rose-50 text-rose-800" />
          <StatCard label="Errores" value={c.error} tone="border-red-400 bg-red-50 text-red-700" />
        </div>

        {errors.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-bold text-red-700">⛔ Errores ({errors.length}) — estas filas NO se aplicarán</h3>
            <div className="overflow-hidden rounded-[10px] border border-red-200">
              <table className="w-full text-sm">
                <tbody>
                  {errors.map((r) => (
                    <tr key={r.rowNumber} className="border-t border-red-100 first:border-t-0">
                      <td className="px-3 py-1.5 text-text-muted">Fila {r.rowNumber}</td>
                      <td className="px-3 py-1.5">{r.nombre || "—"}</td>
                      <td className="px-3 py-1.5 text-red-600">{r.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {plan.missing.length > 0 && (
          <section className="rounded-[10px] border border-rose-300 bg-rose-50/60 p-4">
            <h3 className="text-sm font-bold text-rose-800">
              Bajas potenciales ({plan.missing.length})
            </h3>
            <p className="mt-1 text-xs text-rose-700">
              Estos colaboradores están activos en la app pero <b>no aparecen</b> en el Excel que subiste.
              Solo se darán de baja si marcas la casilla de abajo (baja = desactivar, reversible).
            </p>
            <ul className="mt-2 max-h-32 space-y-0.5 overflow-auto text-sm text-rose-900">
              {plan.missing.map((m) => (
                <li key={m.id}>
                  <span className="font-mono text-xs">{m.codigo}</span> — {m.nombre}
                </li>
              ))}
            </ul>
            <label className="mt-3 flex items-start gap-2 text-sm font-medium text-rose-900">
              <input
                type="checkbox"
                checked={deactivateMissing}
                onChange={(e) => setDeactivateMissing(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Este Excel es el <b>padrón completo</b>: dar de baja a los {plan.missing.length} que no aparecen.
              </span>
            </label>
          </section>
        )}

        {updates.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-bold text-amber-700">🟡 Cambios ({updates.length})</h3>
            <div className="max-h-72 overflow-auto rounded-[10px] border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {updates.map((r) => (
                    <tr key={r.rowNumber} className="border-t border-border/60 align-top first:border-t-0">
                      <td className="w-40 px-3 py-2">
                        <div className="font-medium text-text-secondary">{r.nombre}</div>
                        <div className="font-mono text-xs text-text-muted">{r.codigo}</div>
                      </td>
                      <td className="px-3 py-2">
                        <ul className="space-y-0.5">
                          {r.changes.map((ch, i) => (
                            <li key={i} className="text-xs">
                              <span className="text-text-muted">{ch.label}:</span>{" "}
                              <span className="text-text-secondary line-through">{ch.from}</span>{" "}
                              <span className="text-text-muted">→</span>{" "}
                              <span className="font-medium text-brand-primary">{ch.to}</span>
                            </li>
                          ))}
                          {r.warnings.map((w, i) => (
                            <li key={`w${i}`} className="text-xs text-amber-600">⚠ {w}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {creates.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-bold text-emerald-700">🟢 Altas ({creates.length})</h3>
            <div className="max-h-56 overflow-auto rounded-[10px] border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {creates.map((r) => (
                    <tr key={r.rowNumber} className="border-t border-border/60 first:border-t-0">
                      <td className="px-3 py-1.5 font-mono text-xs text-text-muted">{r.codigo}</td>
                      <td className="px-3 py-1.5">{r.nombre}</td>
                      <td className="px-3 py-1.5 text-xs text-amber-600">
                        {r.warnings.map((w, i) => (
                          <div key={i}>⚠ {w}</div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <button
            onClick={handleApply}
            disabled={loading || (c.create === 0 && c.update === 0 && !deactivateMissing)}
            className="rounded-[9px] bg-brand-accent px-5 py-2.5 text-sm font-bold text-white hover:brightness-95 disabled:opacity-50"
          >
            {loading ? "Aplicando…" : "Aplicar cambios"}
          </button>
          <button
            onClick={reset}
            disabled={loading}
            className="rounded-[9px] border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface disabled:opacity-50"
          >
            Cancelar
          </button>
          {c.create === 0 && c.update === 0 && !deactivateMissing && (
            <span className="text-xs text-text-muted">No hay altas ni cambios por aplicar.</span>
          )}
        </div>
      </div>
    );
  }

  // ---- Paso 1: subir archivo ----
  return (
    <div>
      <form onSubmit={handlePreview} className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-[9px] bg-brand-accent px-4 py-2 text-sm font-bold text-white hover:brightness-95 disabled:opacity-50"
        >
          {loading ? "Analizando…" : "Analizar archivo"}
        </button>
      </form>
      <p className="mt-2 text-xs text-text-muted">
        Nada se guarda todavía: primero verás una vista previa de altas, cambios y bajas para confirmar.
      </p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
