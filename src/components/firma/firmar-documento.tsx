"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { NOMBRE_FIRMA_MAX } from "@/lib/firma";

export function FirmarDocumento({
  documentoId,
  nombreSugerido,
}: {
  documentoId: string;
  nombreSugerido: string;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [nombreFirma, setNombreFirma] = useState(nombreSugerido);
  const [aceptado, setAceptado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/documentos/${documentoId}/firmar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombreFirma, aceptado }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo registrar tu firma.");
      return;
    }
    showToast("Documento firmado. Se guardó tu acuse.");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[14px] border-[1.5px] border-brand-accent bg-vacation-bg p-5"
    >
      <h3 className="font-display text-[15px] font-bold text-brand-primary">Firmar de recibido</h3>
      <p className="mt-1 text-[13px] text-text-muted-2">
        Al firmar quedará registrado tu nombre, la fecha y hora exactas. Este acuse es interno y
        auditable dentro de la plataforma.
      </p>

      <label className="mb-1.5 mt-4 block text-sm font-semibold text-text-secondary">
        Escribe tu nombre completo como firma
      </label>
      <input
        value={nombreFirma}
        onChange={(e) => setNombreFirma(e.target.value)}
        required
        maxLength={NOMBRE_FIRMA_MAX}
        placeholder="Tu nombre completo"
        className="w-full rounded-[9px] border-[1.5px] border-border-input bg-surface px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
      />

      <label className="mt-4 flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={aceptado}
          onChange={(e) => setAceptado(e.target.checked)}
          className="mt-0.5"
        />
        <span className="text-[13px] leading-relaxed text-text-secondary">
          He leído y comprendido el documento, y firmo de recibido / conformidad.
        </span>
      </label>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading || !aceptado}
        className="mt-4 w-full rounded-[10px] bg-brand-accent py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {loading ? "Registrando firma…" : "Firmar documento"}
      </button>
    </form>
  );
}
