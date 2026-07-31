import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Crea y retorna el cliente de Supabase optimizado para el Servidor (Server Components, Server Actions y API Routes).
 * Maneja las cookies HTTP-only de sesión de forma transparente.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // El metodo setAll fue llamado desde un Server Component.
          // Esto puede ignorarse si tienes un middleware renovando las cookies.
        }
      },
    },
  });
}
