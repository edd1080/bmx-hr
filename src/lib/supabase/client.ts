import { createBrowserClient } from "@supabase/ssr";

/**
 * Crea y retorna el cliente de Supabase optimizado para ejecuciones en el cliente (Browser Client).
 * Utilizado en componentes "use client", formularios e interacciones en tiempo real.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
