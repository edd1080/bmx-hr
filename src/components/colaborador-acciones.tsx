"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export function ColaboradorAcciones({ id, activo, esUnoMismo }: { id: string; activo: boolean; esUnoMismo: boolean }) {
  const router = useRouter();
  const showToast = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  async function toggleEstatus() {
    const bajar = activo;
    if (bajar && !confirm("¿Dar de baja a este colaborador? No podrá ingresar, pero se conserva su historial. Es reversible.")) return;
    setLoading("estatus");
    const res = await fetch(`/api/admin/colaboradores/${id}/estatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !activo }),
    });
    setLoading(null);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return showToast(d.error || "No se pudo cambiar el estatus.", false);
    showToast(bajar ? "Colaborador dado de baja" : "Colaborador reactivado");
    router.refresh();
  }

  async function resetPassword() {
    if (!confirm("¿Generar una nueva contraseña temporal para este colaborador?")) return;
    setLoading("reset");
    const res = await fetch(`/api/admin/colaboradores/${id}/reset-password`, { method: "POST" });
    setLoading(null);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return showToast(d.error || "No se pudo restablecer.", false);
    setTempPassword(d.tempPassword);
    showToast("Contraseña restablecida");
  }

  return (
    <div className="rounded-[14px] border border-border bg-surface p-5">
      <h2 className="font-display mb-3 text-[15px] font-bold text-brand-primary">Acciones</h2>

      {tempPassword && (
        <div className="mb-3 rounded-[10px] border border-success bg-success-bg p-3 text-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted-3">Nueva contraseña temporal</div>
          <div className="font-mono font-bold text-brand-primary">{tempPassword}</div>
          <p className="mt-1 text-[11px] text-text-muted-2">Compártela con la persona; deberá cambiarla al ingresar.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          onClick={resetPassword}
          disabled={loading !== null}
          className="rounded-[10px] border-[1.5px] border-border-input px-4 py-2.5 text-sm font-bold text-brand-primary hover:bg-page disabled:opacity-50"
        >
          🔑 Restablecer contraseña
        </button>

        {!esUnoMismo &&
          (activo ? (
            <button
              onClick={toggleEstatus}
              disabled={loading !== null}
              className="rounded-[10px] border-[1.5px] border-border-input px-4 py-2.5 text-sm font-bold text-danger hover:bg-danger-bg disabled:opacity-50"
            >
              🚪 Dar de baja
            </button>
          ) : (
            <button
              onClick={toggleEstatus}
              disabled={loading !== null}
              className="rounded-[10px] bg-success px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              ↩ Reactivar colaborador
            </button>
          ))}
      </div>
    </div>
  );
}
