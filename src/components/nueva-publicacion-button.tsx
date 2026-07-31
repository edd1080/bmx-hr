"use client";

import { useState } from "react";
import { NuevaPublicacionModal } from "@/components/nueva-publicacion-modal";

export function NuevaPublicacionButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[10px] bg-brand-accent px-5 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(74,136,250,.28)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nueva publicación
      </button>
      {open && <NuevaPublicacionModal onClose={() => setOpen(false)} />}
    </>
  );
}
