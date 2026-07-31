"use client";

import { useState } from "react";
import { RevisarSolicitudModal } from "@/components/revisar-solicitud-modal";
import { TypeBadge } from "@/components/type-badge";
import { getInitials, getAvatarColors } from "@/lib/avatar";
import { formatDateRange, formatDays } from "@/lib/leave";

export function PendingApprovalRow({
  request,
}: {
  request: {
    id: string;
    type: string;
    startDate: Date;
    endDate: Date;
    days: number;
    userId: string;
    userName: string;
    area: string | null;
    departamento: string | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const avatar = getAvatarColors(request.userId);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3.5 rounded-[11px] border border-divider px-4 py-3.5">
        <span
          className="font-display flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: avatar.bg, color: avatar.col }}
        >
          {getInitials(request.userName)}
        </span>
        <div className="min-w-[150px] flex-1">
          <div className="text-[14.5px] font-bold text-brand-primary">{request.userName}</div>
          <div className="text-xs text-text-muted-2">
            {[request.area, request.departamento].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
        <div className="min-w-[120px]">
          <div className="mb-0.5">
            <TypeBadge type={request.type} />
          </div>
          <div className="text-xs text-text-muted">
            {formatDateRange(request.startDate, request.endDate)} · {formatDays(request.days)}{" "}
            {request.days === 1 ? "día" : "días"}
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="ml-auto rounded-[9px] bg-brand-accent px-4 py-2 text-xs font-bold text-white"
        >
          Revisar
        </button>
      </div>

      {open && (
        <RevisarSolicitudModal
          request={{
            id: request.id,
            type: request.type,
            startDate: request.startDate,
            endDate: request.endDate,
            days: request.days,
            userName: request.userName,
            departamento: request.departamento,
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
