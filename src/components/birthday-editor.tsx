"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function pretty(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${Number(m[3])} de ${MESES[Number(m[2]) - 1]}`;
}

export function BirthdayEditor({ initial }: { initial: string | null }) {
  const router = useRouter();
  const showToast = useToast();
  const [value, setValue] = useState(initial ?? "");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const res = await fetch("/api/account/birthdate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthDate: value }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || "No se pudo guardar.", false);
      return;
    }
    showToast("Fecha de nacimiento actualizada");
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="rounded-[12px] border border-divider bg-page px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-wide text-text-muted-3">
            🎂 Fecha de nacimiento
          </div>
          <div className={`text-sm font-semibold ${initial ? "text-brand-primary" : "text-text-muted-3"}`}>
            {initial ? pretty(initial) : "Sin registrar"}
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg border border-border-input bg-surface px-3 py-1.5 text-xs font-bold text-brand-accent"
          >
            {initial ? "Cambiar" : "Agregar"}
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="rounded-[9px] border-[1.5px] border-border-input px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-accent"
          />
          <button
            onClick={save}
            disabled={loading}
            className="rounded-[9px] bg-brand-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? "Guardando…" : "Guardar"}
          </button>
          <button
            onClick={() => {
              setValue(initial ?? "");
              setEditing(false);
            }}
            className="rounded-[9px] border-[1.5px] border-border-input px-4 py-2 text-sm font-bold text-text-secondary"
          >
            Cancelar
          </button>
        </div>
      )}
      <p className="mt-2 text-[11px] text-text-muted-3">
        Se usa para el calendario de cumpleaños y la felicitación en Comunicación. El año no se muestra
        públicamente.
      </p>
    </div>
  );
}
