"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export type ColaboradorInitial = {
  id?: string;
  employeeCode?: string;
  name?: string;
  email?: string;
  curp?: string;
  puesto?: string;
  area?: string;
  departamento?: string;
  telefono?: string;
  category?: string;
  vacationDaysAssigned?: number;
  hireDate?: string | null;
  birthDate?: string | null;
  empresa?: string | null;
  isHR?: boolean;
  managerId?: string | null;
};

const input =
  "w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent";
const label = "mb-1.5 block text-sm font-semibold text-text-secondary";

export function ColaboradorForm({
  mode,
  initial = {},
  managers,
  onDone,
}: {
  mode: "create" | "edit";
  initial?: ColaboradorInitial;
  managers: { id: string; name: string }[];
  onDone?: () => void;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [f, setF] = useState<ColaboradorInitial>({
    category: "ADMINISTRATIVO",
    vacationDaysAssigned: 12,
    ...initial,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ username: string; tempPassword: string } | null>(null);

  function set<K extends keyof ColaboradorInitial>(k: K, v: ColaboradorInitial[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const url = mode === "create" ? "/api/admin/colaboradores" : `/api/admin/colaboradores/${initial.id}`;
    const res = await fetch(url, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "No se pudo guardar.");
      return;
    }
    if (mode === "create") {
      setCreated({ username: data.user.username, tempPassword: data.tempPassword });
      router.refresh();
    } else {
      showToast("Datos actualizados");
      router.refresh();
      onDone?.();
    }
  }

  if (created) {
    return (
      <div className="rounded-[12px] border border-success bg-success-bg p-5 text-center">
        <div className="text-2xl">✅</div>
        <p className="mt-1 font-display text-lg font-bold text-brand-primary">Colaborador creado</p>
        <p className="mt-2 text-sm text-text-secondary">Comparte estos accesos con la persona:</p>
        <div className="mx-auto mt-3 max-w-xs rounded-[10px] bg-surface p-4 text-left">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted-3">Usuario</div>
          <div className="mb-2 font-mono text-sm font-bold text-brand-primary">{created.username}</div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted-3">Contraseña temporal</div>
          <div className="font-mono text-sm font-bold text-brand-primary">{created.tempPassword}</div>
        </div>
        <p className="mt-3 text-xs text-text-muted-2">
          La persona deberá cambiar la contraseña la primera vez que ingrese.
        </p>
        <button
          onClick={() => onDone?.()}
          className="mt-4 rounded-[10px] bg-brand-accent px-5 py-2.5 text-sm font-bold text-white"
        >
          Listo
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Código de empleado {mode === "create" && <span className="text-danger">*</span>}</label>
          <input
            className={input}
            value={f.employeeCode ?? ""}
            onChange={(e) => set("employeeCode", e.target.value)}
            disabled={mode === "edit"}
            required={mode === "create"}
            placeholder="Ej. 1042"
          />
          {mode === "edit" && <p className="mt-1 text-[11px] text-text-muted-3">El código no se puede cambiar.</p>}
        </div>
        <div>
          <label className={label}>Nombre completo <span className="text-danger">*</span></label>
          <input className={input} value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div>
          <label className={label}>Correo</label>
          <input className={input} type="email" value={f.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="nombre@empresa.com" />
        </div>
        <div>
          <label className={label}>Teléfono</label>
          <input className={input} value={f.telefono ?? ""} onChange={(e) => set("telefono", e.target.value)} />
        </div>
        <div>
          <label className={label}>CURP</label>
          <input className={input} value={f.curp ?? ""} onChange={(e) => set("curp", e.target.value.toUpperCase())} maxLength={18} />
        </div>
        <div>
          <label className={label}>Puesto</label>
          <input className={input} value={f.puesto ?? ""} onChange={(e) => set("puesto", e.target.value)} />
        </div>
        <div>
          <label className={label}>Área</label>
          <input className={input} value={f.area ?? ""} onChange={(e) => set("area", e.target.value)} />
        </div>
        <div>
          <label className={label}>Departamento</label>
          <input className={input} value={f.departamento ?? ""} onChange={(e) => set("departamento", e.target.value)} />
        </div>
        <div>
          <label className={label}>Categoría</label>
          <select className={input} value={f.category ?? "ADMINISTRATIVO"} onChange={(e) => set("category", e.target.value)}>
            <option value="ADMINISTRATIVO">Administrativo</option>
            <option value="OPERATIVO">Operativo</option>
          </select>
        </div>
        <div>
          <label className={label}>Empresa (DC-3)</label>
          <select className={input} value={f.empresa ?? ""} onChange={(e) => set("empresa", e.target.value)}>
            <option value="">Sin asignar</option>
            <option value="AEX">Alta Extracción (AEX)</option>
            <option value="CSA">Comercializadora Sanbia (CSA)</option>
          </select>
        </div>
        <div>
          <label className={label}>Días de vacaciones</label>
          <input className={input} type="number" min="0" value={f.vacationDaysAssigned ?? 0} onChange={(e) => set("vacationDaysAssigned", Number(e.target.value))} />
        </div>
        <div>
          <label className={label}>Fecha de ingreso</label>
          <input className={input} type="date" value={f.hireDate ?? ""} onChange={(e) => set("hireDate", e.target.value)} />
        </div>
        <div>
          <label className={label}>Fecha de nacimiento</label>
          <input className={input} type="date" value={f.birthDate ?? ""} onChange={(e) => set("birthDate", e.target.value)} />
        </div>
        <div>
          <label className={label}>Jefe inmediato</label>
          <select className={input} value={f.managerId ?? ""} onChange={(e) => set("managerId", e.target.value)}>
            <option value="">Sin jefe asignado</option>
            {managers
              .filter((m) => m.id !== initial.id)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2.5 rounded-[10px] border border-divider px-4 py-3">
        <input type="checkbox" checked={!!f.isHR} onChange={(e) => set("isHR", e.target.checked)} className="h-4 w-4 accent-[#4A88FA]" />
        <span className="text-sm font-semibold text-brand-primary">Pertenece a Gente &amp; Gestión (acceso de administrador)</span>
      </label>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-5 flex gap-3">
        {onDone && (
          <button type="button" onClick={() => onDone()} className="flex-1 rounded-[10px] border-[1.5px] border-border-input bg-surface py-3 text-sm font-bold text-text-secondary">
            Cancelar
          </button>
        )}
        <button type="submit" disabled={loading} className="flex-1 rounded-[10px] bg-brand-accent py-3 text-sm font-bold text-white disabled:opacity-50">
          {loading ? "Guardando…" : mode === "create" ? "Crear colaborador" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
