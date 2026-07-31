"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast-provider";
import {
  RECONOCE_CATEGORIAS,
  RECONOCE_META,
  RECONOCE_MENSAJE_MAX,
  type ReconoceCategoria,
} from "@/lib/comunicacion";

type Colega = { id: string; name: string; area: string | null };

export function ReconocerModal({ colegas, onClose }: { colegas: Colega[]; onClose: () => void }) {
  const router = useRouter();
  const showToast = useToast();
  const [categoria, setCategoria] = useState<ReconoceCategoria>("GRACIAS");
  const [paraId, setParaId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const seleccionado = colegas.find((c) => c.id === paraId) ?? null;
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return colegas.slice(0, 30);
    return colegas.filter((c) => c.name.toLowerCase().includes(q) || (c.area ?? "").toLowerCase().includes(q)).slice(0, 30);
  }, [busca, colegas]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!paraId) {
      setError("Elige a quién quieres reconocer.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/reconocimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paraId, categoria, mensaje }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "No se pudo enviar el reconocimiento.");
      return;
    }
    showToast("¡Reconocimiento enviado! 🎉");
    onClose();
    router.refresh();
  }

  const inputCls =
    "w-full rounded-[9px] border-[1.5px] border-border-input px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent";

  return (
    <Modal title="Reconocer a un compañero" subtitle="Se mostrará en el feed de Comunicación" onClose={onClose} maxWidth="560px">
      <form onSubmit={handleSubmit}>
        <label className="mb-2 block text-sm font-semibold text-text-secondary">Motivo</label>
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {RECONOCE_CATEGORIAS.map((c) => {
            const m = RECONOCE_META[c];
            const active = categoria === c;
            return (
              <button key={c} type="button" onClick={() => setCategoria(c)}
                className={`flex flex-col items-center gap-1 rounded-[11px] border-[1.5px] px-2 py-3 text-center transition-colors ${
                  active ? "border-brand-accent bg-vacation-bg" : "border-divider bg-surface"
                }`}>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg text-base" style={{ background: m.bg, color: m.text }}>{m.icon}</span>
                <span className="text-[11px] font-bold leading-tight text-brand-primary">{m.label}</span>
              </button>
            );
          })}
        </div>

        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">¿A quién?</label>
        {seleccionado ? (
          <div className="mb-4 flex items-center gap-2 rounded-[9px] border border-brand-accent bg-vacation-bg px-3.5 py-2.5">
            <span className="flex-1 text-sm font-bold text-brand-primary">{seleccionado.name}</span>
            <button type="button" onClick={() => setParaId(null)} className="text-xs font-semibold text-brand-accent">Cambiar</button>
          </div>
        ) : (
          <div className="mb-4">
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar compañero…" className={`mb-2 ${inputCls}`} />
            <div className="max-h-44 overflow-y-auto rounded-[10px] border border-border">
              {filtrados.length === 0 ? (
                <p className="px-3 py-3 text-sm text-text-muted-2">Sin resultados.</p>
              ) : (
                filtrados.map((c) => (
                  <button key={c.id} type="button" onClick={() => { setParaId(c.id); setBusca(""); }}
                    className="flex w-full items-center gap-2.5 border-b border-divider px-3 py-2 text-left last:border-0 hover:bg-page">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-brand-primary">{c.name}</span>
                      {c.area && <span className="block truncate text-[11px] text-text-muted-2">{c.area}</span>}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <label className="mb-1.5 block text-sm font-semibold text-text-secondary">Mensaje</label>
        <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} required rows={3} maxLength={RECONOCE_MENSAJE_MAX}
          placeholder="Ej. Gracias por apoyarme con el cierre de mes, ¡eres un crack!"
          className="mb-4 w-full resize-y rounded-[9px] border-[1.5px] border-border-input px-3.5 py-3 text-sm text-brand-primary outline-none focus:border-brand-accent" />

        {error && <p className="mb-4 text-sm text-danger">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-[10px] border-[1.5px] border-border-input bg-surface py-3 text-sm font-bold text-text-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 rounded-[10px] bg-brand-accent py-3 text-sm font-bold text-white disabled:opacity-50">
            {loading ? "Enviando…" : "Enviar reconocimiento"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
