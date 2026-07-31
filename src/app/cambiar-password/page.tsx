"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      // Actualiza la contraseña en Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password,
        data: { mustChangePassword: false },
      });

      if (authError) {
        // Fallback a API local si aun no esta activo Supabase Auth
        const res = await fetch("/api/account/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "No se pudo cambiar la contraseña.");
          setLoading(false);
          return;
        }
      } else {
        // Sincroniza el cambio en la base de datos
        await fetch("/api/account/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
      }

      setDone(true);
      setTimeout(async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }, 1500);
    } catch {
      setError("Ocurrió un error inesperado al actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#1C3565_0%,#16274B_100%)] px-4">
      <div className="w-full max-w-sm rounded-xl bg-surface p-8 shadow-lg">
        <Image
          src="/logo-azul.png"
          alt="bia Mexico Coffee"
          width={130}
          height={70}
          className="mb-4"
          priority
        />
        <h1 className="font-display text-xl font-bold text-brand-primary">
          Establece tu nueva contraseña
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Es tu primer inicio de sesión, define una contraseña propia para continuar.
        </p>

        {done ? (
          <p className="mt-6 text-sm text-success">
            Contraseña actualizada. Inicia sesión de nuevo…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary">
                Nueva contraseña
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-brand-gray px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary">
                Confirmar contraseña
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-md border border-brand-gray px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-brand-navy px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary-dark disabled:opacity-50"
            >
              {loading ? "Guardando…" : "Guardar y continuar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
