"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/toast-provider";
import { getPushState, enablePush, disablePush, isPushSupported, type PushState } from "@/lib/push-client";

const BellIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

export function PushToggle() {
  const showToast = useToast();
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    getPushState().then(setState);
  }, []);

  const on = !!state && state.subscribed && state.permission === "granted";
  const blocked = !!state && state.permission === "denied";

  async function toggle() {
    if (busy || !state) return;
    setBusy(true);
    if (on) {
      await disablePush();
      showToast("Notificaciones push desactivadas en este dispositivo");
    } else {
      const err = await enablePush();
      if (err) {
        showToast(err, false);
        setBusy(false);
        setState(await getPushState());
        return;
      }
      showToast("Notificaciones push activadas");
    }
    setState(await getPushState());
    setBusy(false);
  }

  async function test() {
    setTesting(true);
    const res = await fetch("/api/push/test", { method: "POST" });
    setTesting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || "No se pudo enviar la prueba.", false);
      return;
    }
    showToast("Enviada. Debe llegarte en unos segundos 🔔");
  }

  const supported = state ? state.supported : isPushSupported();

  return (
    <div className="max-w-[720px] rounded-[14px] border border-border bg-surface p-5">
      <div className="flex items-center gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-vacation-bg text-vacation-text">
          {BellIcon}
        </span>
        <div className="flex-1">
          <h3 className="font-display text-[15px] font-bold text-brand-primary">Notificaciones push</h3>
          <p className="text-xs text-text-muted-2">
            Recibe avisos de solicitudes, metas, documentos y más en este dispositivo, aunque no tengas la app abierta.
          </p>
        </div>

        {supported && !blocked && (
          <button
            onClick={toggle}
            disabled={busy || !state}
            role="switch"
            aria-checked={on}
            aria-label="Notificaciones push"
            className={`relative h-7 w-[52px] shrink-0 rounded-full border transition-colors disabled:opacity-60 ${
              on ? "border-brand-accent bg-brand-accent" : "border-border bg-divider"
            }`}
          >
            <span
              className={`absolute top-[2px] h-[22px] w-[22px] rounded-full bg-white shadow transition-all ${
                on ? "left-[26px]" : "left-[2px]"
              }`}
            />
          </button>
        )}
      </div>

      {on && (
        <div className="mt-4 border-t border-divider pt-4">
          <button
            onClick={test}
            disabled={testing}
            className="rounded-[9px] border-[1.5px] border-border-input bg-surface px-4 py-2 text-sm font-bold text-text-secondary hover:border-brand-accent disabled:opacity-50"
          >
            {testing ? "Enviando…" : "Enviar notificación de prueba"}
          </button>
        </div>
      )}

      {blocked && (
        <p className="mt-3 border-t border-divider pt-3 text-xs text-danger">
          Bloqueaste las notificaciones para este sitio. Actívalas desde la configuración del navegador
          (candado junto a la dirección) para poder recibirlas.
        </p>
      )}

      {!supported && (
        <p className="mt-3 border-t border-divider pt-3 text-xs text-text-muted-3">
          Este navegador no soporta notificaciones push. En iPhone/iPad primero agrega la app a la
          pantalla de inicio («Compartir → Agregar a inicio») y ábrela desde ahí.
        </p>
      )}
    </div>
  );
}
