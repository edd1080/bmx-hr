"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getInitials, getAvatarColors } from "@/lib/avatar";
import { useToast } from "@/components/toast-provider";

type Row = {
  id: string;
  name: string;
  employeeCode: string | null;
  puesto: string | null;
  area: string | null;
  empresa: string | null;
  isHR: boolean;
  activo: boolean;
};

export function ColaboradoresTable({ rows, currentUserId }: { rows: Row[]; currentUserId: string }) {
  const router = useRouter();
  const showToast = useToast();
  const [q, setQ] = useState("");
  const [estatus, setEstatus] = useState<"ACTIVOS" | "BAJA" | "TODOS">("ACTIVOS");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function toggleEstatus(row: Row) {
    if (row.activo && !confirm(`¿Bloquear el acceso de ${row.name}? Se da de baja (no podrá ingresar), se conserva su historial y es reversible.`)) {
      return;
    }
    setLoadingId(row.id);
    const res = await fetch(`/api/admin/colaboradores/${row.id}/estatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !row.activo }),
    });
    setLoadingId(null);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return showToast(d.error || "No se pudo cambiar el estatus.", false);
    showToast(row.activo ? `${row.name} dado de baja (acceso bloqueado)` : `${row.name} reactivado`);
    router.refresh();
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (estatus === "ACTIVOS" && !r.activo) return false;
      if (estatus === "BAJA" && r.activo) return false;
      if (!term) return true;
      return (
        r.name.toLowerCase().includes(term) ||
        (r.employeeCode ?? "").toLowerCase().includes(term) ||
        (r.puesto ?? "").toLowerCase().includes(term) ||
        (r.area ?? "").toLowerCase().includes(term)
      );
    });
  }, [rows, q, estatus]);

  const tabs: { key: typeof estatus; label: string }[] = [
    { key: "ACTIVOS", label: "Activos" },
    { key: "BAJA", label: "Baja" },
    { key: "TODOS", label: "Todos" },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, código, puesto o área…"
          className="min-w-[240px] flex-1 rounded-[10px] border-[1.5px] border-border-input px-4 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
        />
        <div className="flex rounded-[10px] border border-border-input p-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setEstatus(t.key)}
              className={`rounded-[8px] px-3.5 py-1.5 text-sm font-bold ${
                estatus === t.key ? "bg-brand-accent text-white" : "text-text-muted-2"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-xs text-text-muted-2">{filtered.length} colaboradores</p>

      <div className="overflow-hidden rounded-[14px] border border-border bg-surface">
        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-text-muted-3">Sin resultados.</p>
        ) : (
          filtered.map((r) => {
            const av = getAvatarColors(r.id);
            const esUnoMismo = r.id === currentUserId;
            return (
              <div
                key={r.id}
                className="flex items-center gap-3 border-b border-divider px-4 py-3 last:border-0 hover:bg-page"
              >
                <Link href={`/admin/colaboradores/${r.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold"
                    style={{ background: av.bg, color: av.col, opacity: r.activo ? 1 : 0.5 }}
                  >
                    {getInitials(r.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-brand-primary">{r.name}</span>
                      {r.isHR && (
                        <span className="rounded-full bg-vacation-bg px-2 py-0.5 text-[10px] font-bold text-vacation-text">G&G</span>
                      )}
                      {r.empresa && (
                        <span className="rounded-full bg-page px-2 py-0.5 text-[10px] font-semibold text-text-muted-2">{r.empresa}</span>
                      )}
                    </div>
                    <div className="truncate text-xs text-text-muted-2">
                      {r.employeeCode ? `${r.employeeCode} · ` : ""}
                      {r.puesto || r.area || "Sin puesto"}
                    </div>
                  </div>
                </Link>

                {r.activo ? (
                  <span className="shrink-0 rounded-full bg-success-bg px-2.5 py-1 text-[10.5px] font-bold text-success">Activo</span>
                ) : (
                  <span className="shrink-0 rounded-full bg-danger-bg px-2.5 py-1 text-[10.5px] font-bold text-danger">Baja</span>
                )}

                {esUnoMismo ? (
                  <span className="shrink-0 text-[11px] text-text-muted-3" title="No puedes bloquear tu propio acceso">
                    (tú)
                  </span>
                ) : (
                  <button
                    onClick={() => toggleEstatus(r)}
                    disabled={loadingId === r.id}
                    title={r.activo ? "Bloquear acceso (dar de baja)" : "Reactivar acceso"}
                    className={`shrink-0 rounded-[8px] border-[1.5px] px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${
                      r.activo
                        ? "border-border-input text-danger hover:bg-danger-bg"
                        : "border-success text-success hover:bg-success-bg"
                    }`}
                  >
                    {loadingId === r.id ? "…" : r.activo ? "🚪 Bloquear" : "↩ Reactivar"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
