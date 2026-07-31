"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type Toast = { message: string; ok: boolean } | null;
type ToastContextValue = (message: string, ok?: boolean) => void;

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, ok = true) => {
    setToast({ message, ok });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div className="no-print fixed bottom-6 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-3 rounded-xl bg-brand-navy px-5 py-3.5 text-sm font-semibold text-white shadow-2xl">
          <span
            className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[13px]"
            style={{ background: toast.ok ? "#1F8A5B" : "#C0392B" }}
          >
            {toast.ok ? "✓" : "✕"}
          </span>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
