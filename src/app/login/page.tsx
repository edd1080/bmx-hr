"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      // Permite inicio de sesion con email o nombre de usuario
      const email = username.includes("@")
        ? username.trim().toLowerCase()
        : `${username.trim().toLowerCase()}@vacaciones.internal`;

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Fallback a API local si Supabase Auth no ha recibido credenciales aun
        const res = await fetch("/api/auth/login-legacy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
          setError("Usuario o contraseña incorrectos.");
          setLoading(false);
          return;
        }
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Ocurrió un error al iniciar sesión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-wrap">
      {/* Brand panel */}
      <div className="flex min-h-screen flex-1 basis-[440px] flex-col justify-between bg-[linear-gradient(160deg,#1C3565_0%,#16274B_100%)] px-10 py-12 text-white sm:px-14">
        <div className="inline-flex self-start rounded-xl bg-surface px-4 py-3">
          <Image src="/logo-azul.png" alt="bia Mexico Coffee" width={100} height={54} priority />
        </div>

        <div className="max-w-[420px]">
          <div className="mb-4 text-[13px] font-semibold uppercase tracking-[2.5px] text-brand-accent-lighter">
            Gente &amp; Gestión
          </div>
          <h1 className="font-display mb-4 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-[42px]">
            Mis Gestiones
          </h1>
          <p className="text-[17px] leading-relaxed text-[#C3D2EF]">
            Vacaciones y permisos, metas y organigrama en un solo lugar. Solicita, aprueba y da
            seguimiento con total trazabilidad.
          </p>
        </div>

        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2 text-[13.5px] font-medium text-[#AFC4EC]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8FB0F5" strokeWidth="2">
              <path d="M12 2l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V6z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            Acceso cifrado por rol
          </div>
          <div className="flex items-center gap-2 text-[13.5px] font-medium text-[#AFC4EC]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8FB0F5" strokeWidth="2">
              <path d="M4 4h16v12H4z" />
              <path d="M4 20h16" />
            </svg>
            Reportes exportables
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen flex-1 basis-[520px] items-center justify-center px-8 py-12">
        <div className="w-full max-w-[420px]">
          <h2 className="font-display mb-1.5 text-[27px] font-bold text-brand-primary">
            Iniciar sesión
          </h2>
          <p className="mb-7 text-[15px] text-text-muted">
            Ingresa con tu usuario y contraseña.
          </p>

          <form onSubmit={handleSubmit}>
            <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">
              Usuario o Correo
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. laura.torres"
              className="mb-4 w-full rounded-[10px] border-[1.5px] border-border-input px-4 py-3 text-[15px] text-brand-primary outline-none focus:border-brand-accent"
            />

            <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mb-3.5 w-full rounded-[10px] border-[1.5px] border-border-input px-4 py-3 text-[15px] text-brand-primary outline-none focus:border-brand-accent"
            />

            <p className="mb-6 text-[13px] text-text-muted">
              ¿Olvidaste tu contraseña? Contacta a Gente y Gestión.
            </p>

            {error && <p className="mb-4 text-sm text-danger">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[10px] bg-brand-navy py-3.5 text-[15.5px] font-bold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
            >
              {loading ? "Ingresando…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
