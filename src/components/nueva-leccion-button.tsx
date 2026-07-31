"use client";

import { useState } from "react";
import { NuevaLeccionModal } from "@/components/nueva-leccion-modal";

export function NuevaLeccionButton({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-brand-accent px-4 py-2.5 text-sm font-bold text-brand-accent hover:bg-vacation-bg"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Agregar lección
      </button>
      {open && <NuevaLeccionModal courseId={courseId} onClose={() => setOpen(false)} />}
    </>
  );
}
