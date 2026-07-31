import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type AuthContext = {
  supabaseUser: { id: string; email?: string };
  user: {
    id: string;
    employeeCode: string | null;
    name: string;
    username: string;
    email: string | null;
    isHR: boolean;
    mustChangePassword: boolean;
    category: string;
    managerId: string | null;
  };
};

/**
 * Obtiene el contexto del usuario autenticado en la sesion actual.
 * Retorna null si no hay una sesion valida.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !supabaseUser) return null;

  // Busca el perfil correspondiente en la tabla public.User por email o username
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: supabaseUser.id },
        { email: supabaseUser.email },
      ],
      activo: true,
    },
    select: {
      id: true,
      employeeCode: true,
      name: true,
      username: true,
      email: true,
      isHR: true,
      mustChangePassword: true,
      category: true,
      managerId: true,
    },
  });

  if (!user) return null;

  return { supabaseUser, user };
}

/**
 * Exige que el usuario este autenticado. Si no lo esta, retorna una respuesta 401.
 */
export async function requireAuth(): Promise<
  { ok: true; context: AuthContext } | { ok: false; response: NextResponse }
> {
  const context = await getAuthContext();
  if (!context) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autenticado." }, { status: 401 }),
    };
  }
  return { ok: true, context };
}

/**
 * Exige que el usuario pertenezca al rol Gente & Gestion / Administrador (isHR === true).
 */
export async function requireHR(): Promise<
  { ok: true; context: AuthContext } | { ok: false; response: NextResponse }
> {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult;

  if (!authResult.context.user.isHR) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acceso denegado: Se requieren permisos de Gente & Gestión." },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Exige que el usuario sea Gente & Gestion (HR) o el Jefe Directo (Manager) del objetivo.
 */
export async function requireManagerOrHR(targetUserId: string): Promise<
  { ok: true; context: AuthContext } | { ok: false; response: NextResponse }
> {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult;

  const { user } = authResult.context;

  if (user.isHR || user.id === targetUserId) {
    return authResult;
  }

  // Verifica si el usuario actual es el jefe directo del targetUserId
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { managerId: true },
  });

  if (targetUser?.managerId === user.id) {
    return authResult;
  }

  return {
    ok: false,
    response: NextResponse.json(
      { error: "Acceso denegado: No tienes permisos para gestionar a este colaborador." },
      { status: 403 }
    ),
  };
}
