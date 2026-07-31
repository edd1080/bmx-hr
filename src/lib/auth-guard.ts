import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type AuthContext = {
  sessionUser: { id: string; username: string; isHR: boolean; mustChangePassword: boolean };
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
 * Obtiene el contexto del usuario autenticado en la sesión actual mediante NextAuth.
 * Retorna null si no hay una sesión válida o activa.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
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

  return {
    sessionUser: {
      id: session.user.id,
      username: session.user.username ?? user.username,
      isHR: session.user.isHR ?? user.isHR,
      mustChangePassword: session.user.mustChangePassword ?? user.mustChangePassword,
    },
    user,
  };
}

/**
 * Exige que el usuario esté autenticado. Si no lo está, retorna una respuesta 401.
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
 * Exige que el usuario pertenezca al rol Gente & Gestión / Administrador (isHR === true).
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
 * Exige que el usuario sea Gente & Gestión (HR), el propio usuario objetivo o su Jefe Directo (Manager).
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
