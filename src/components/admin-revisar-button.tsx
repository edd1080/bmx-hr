"use client";

import { useState } from "react";
import { RevisarSolicitudModal } from "@/components/revisar-solicitud-modal";

export function AdminRevisarButton({
  request,
}: {
  request: {
    id: string;
    type: string;
    startDate: Date;
    endDate: Date;
    days: number;
    userName: string;
    departamento: string | null;
  };
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-accent px-3.5 py-1.5 text-xs font-bold text-white"
      >
        Revisar
      </button>
      {open && <RevisarSolicitudModal request={request} onClose={() => setOpen(false)} />}
    </>
  );
}
