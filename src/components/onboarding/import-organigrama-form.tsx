"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Result = {
  direccionesNuevas: number;
  posicionesNuevas: number;
  posicionesActualizadas: number;
  reportaAsignados: number;
  filas: number;
};

export function ImportOrganigramaForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Selecciona un archivo primero.");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    setLoading(true);
    const res = await fetch("/api/onboarding/import", { method: "POST", body: fd });
    setLoading(false);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(d.error || "No se pudo importar.");
      return;
    }
    setResult(d.result);
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={submit} className="flex flex-wrap items-center gap-3">
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="text-sm" />
        <button
          type="submit"
          disabled={loading}
          className="rounded-[10px] bg-brand-navy px-4 py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Procesando…" : "Importar organigrama"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {result && (
        <div className="mt-4 rounded-[10px] border border-success bg-success-bg p-4 text-sm text-success">
          <p className="font-bold">✓ Organigrama importado ({result.filas} filas)</p>
          <ul className="mt-2 space-y-0.5 text-[13px] text-text-secondary">
            <li>{result.direccionesNuevas} direcciones nuevas</li>
            <li>{result.posicionesNuevas} posiciones nuevas · {result.posicionesActualizadas} actualizadas</li>
            <li>{result.reportaAsignados} enlaces “reporta a” asignados</li>
          </ul>
        </div>
      )}
    </div>
  );
}
