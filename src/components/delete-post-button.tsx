"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();
  const showToast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Eliminar esta publicación? No se puede deshacer.")) return;
    setLoading(true);
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      showToast("No se pudo eliminar.", false);
      return;
    }
    showToast("Publicación eliminada");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Eliminar publicación"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted-3 hover:bg-danger-bg hover:text-danger disabled:opacity-50"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      </svg>
    </button>
  );
}
