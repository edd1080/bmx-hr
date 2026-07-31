"use client";

import { getInitials, getAvatarColors } from "@/lib/avatar";
import { formatDate } from "@/lib/leave";
import type { OrgPerson } from "@/lib/org";

export function OrgDetailPanel({
  person,
  manager,
  onFocus,
  onClose,
}: {
  person: OrgPerson;
  manager: OrgPerson | null;
  onFocus: (id: string) => void;
  onClose: () => void;
}) {
  const avatar = getAvatarColors(person.id);

  return (
    <div className="sticky top-[88px] rounded-[14px] border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <div
          className="font-display mb-3 flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold"
          style={{ background: avatar.bg, color: avatar.col }}
        >
          {getInitials(person.name)}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ficha"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted-2 hover:bg-page hover:text-brand-primary"
        >
          ✕
        </button>
      </div>
      <h3 className="font-display text-[16.5px] font-bold text-brand-primary">{person.name}</h3>
      <p className="mt-0.5 text-sm text-text-muted-2">{person.puesto || "Puesto sin registrar"}</p>

      <div className="mt-4 flex flex-col gap-3.5">
        <Field label="Código de empleado" value={person.employeeCode} />
        <Field
          label="Área / Departamento"
          value={[person.area, person.departamento].filter(Boolean).join(" · ") || null}
        />
        <Field label="Categoría" value={person.category === "OPERATIVO" ? "Operativo" : "Administrativo"} />
        <Field
          label="Correo"
          value={person.email}
          link={person.email ? `mailto:${person.email}` : undefined}
        />
        <Field
          label="Teléfono"
          value={person.telefono}
          link={person.telefono ? `tel:${person.telefono}` : undefined}
        />
        <Field label="Fecha de ingreso" value={person.hireDate ? formatDate(person.hireDate) : null} />
        <Field
          label="Jefe inmediato"
          value={manager?.name ?? "Sin jefe asignado"}
          onClick={manager ? () => onFocus(manager.id) : undefined}
        />
        <Field
          label="Equipo"
          value={`${person.directReportCount} directo${person.directReportCount === 1 ? "" : "s"} · ${person.downstreamHeadcount} en total`}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  link,
  onClick,
}: {
  label: string;
  value: string | null;
  link?: string;
  onClick?: () => void;
}) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-text-muted-3">{label}</div>
      {value ? (
        link ? (
          <a href={link} className="text-sm font-semibold text-brand-accent">
            {value}
          </a>
        ) : onClick ? (
          <button type="button" onClick={onClick} className="text-sm font-semibold text-brand-accent">
            {value}
          </button>
        ) : (
          <div className="text-sm font-semibold text-brand-primary">{value}</div>
        )
      ) : (
        <div className="text-sm text-text-muted-3">Sin registrar</div>
      )}
    </div>
  );
}
