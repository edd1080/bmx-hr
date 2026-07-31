"use client";

import { getInitials, getAvatarColors } from "@/lib/avatar";
import type { OrgPerson } from "@/lib/org";

export function OrgPersonCard({
  person,
  variant = "grid",
  active = false,
  onClick,
  onShowDetail,
}: {
  person: OrgPerson;
  variant?: "spine" | "grid" | "flat";
  active?: boolean;
  onClick?: () => void;
  onShowDetail?: () => void;
}) {
  const avatar = getAvatarColors(person.id);

  return (
    <div
      className={`flex w-full items-center gap-1.5 rounded-[11px] border-[1.5px] bg-surface py-3 pl-4 pr-2 transition-colors ${
        active ? "border-brand-accent bg-vacation-bg" : "border-divider hover:border-border-input"
      } ${variant === "spine" ? "max-w-[420px]" : ""}`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span
          className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: avatar.bg, color: avatar.col }}
        >
          {getInitials(person.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-bold text-brand-primary">{person.name}</span>
          <span className="block truncate text-xs text-text-muted-2">
            {person.puesto || "Puesto sin registrar"}
          </span>
          {person.directReportCount > 0 && (
            <span className="mt-0.5 block text-[11px] text-text-muted-3">
              {person.directReportCount} directo{person.directReportCount === 1 ? "" : "s"} ·{" "}
              {person.downstreamHeadcount} en su equipo
            </span>
          )}
        </span>
      </button>

      {onShowDetail && (
        <button
          type="button"
          onClick={onShowDetail}
          aria-label={`Ver ficha de ${person.name}`}
          title="Ver ficha completa"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border-input bg-page text-text-muted-2 hover:text-brand-primary"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="3.5" width="16" height="17" rx="2" />
            <path d="M8 8h8M8 12h8M8 16h5" />
          </svg>
        </button>
      )}
    </div>
  );
}
