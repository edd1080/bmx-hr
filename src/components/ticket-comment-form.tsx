"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export function TicketCommentForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const showToast = useToast();
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mensaje.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje }),
    });
    setLoading(false);
    if (!res.ok) {
      showToast("No se pudo enviar el comentario.", false);
      return;
    }
    setMensaje("");
    showToast("Comentario enviado");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        rows={3}
        placeholder="Escribe un comentario o respuesta…"
        className="w-full resize-y rounded-[9px] border-[1.5px] border-border-input px-3.5 py-3 text-sm text-brand-primary outline-none focus:border-brand-accent"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !mensaje.trim()}
          className="rounded-[10px] bg-brand-accent px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? "Enviando…" : "Comentar"}
        </button>
      </div>
    </form>
  );
}
