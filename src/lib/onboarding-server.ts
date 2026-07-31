import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export type OnboardingRole =
  | { role: "rh" }
  | { role: "n1"; areaId: string; areaNombre: string }
  | { role: "none" };

/**
 * Determina el rol del usuario en el módulo de Onboarding:
 *  - "rh": pertenece a Gente & Gestión (isHR) — acceso total.
 *  - "n1": es gerente de alguna Dirección — solo configura SU dirección.
 *  - "none": sin acceso de escritura.
 */
export async function getOnboardingRole(): Promise<OnboardingRole> {
  const session = await auth();
  if (!session?.user) return { role: "none" };
  if (session.user.isHR) return { role: "rh" };
  const dir = await prisma.direccion.findFirst({
    where: { gerenteN1Id: session.user.id },
    select: { id: true, nombre: true },
  });
  if (dir) return { role: "n1", areaId: dir.id, areaNombre: dir.nombre };
  return { role: "none" };
}

/** ¿Puede este rol escribir la configuración de esta posición? */
export function canConfigure(role: OnboardingRole, posicionAreaId: string): boolean {
  if (role.role === "rh") return true;
  if (role.role === "n1") return role.areaId === posicionAreaId;
  return false;
}

/**
 * Recalcula el estado de la configuración de una posición:
 *  - "none": sin sesiones.
 *  - "partial": tiene sesiones pero alguna obligatoria sin objetivo.
 *  - "complete": tiene sesiones y todas las obligatorias con objetivo.
 * Crea el OnboardingConfig si no existía. Devuelve el estado resultante.
 */
export async function recomputeEstado(posicionId: string, actorId?: string): Promise<string> {
  const config = await prisma.onboardingConfig.upsert({
    where: { posicionId },
    update: actorId ? { actualizadoPor: actorId } : {},
    create: { posicionId, actualizadoPor: actorId ?? null, estado: "none" },
    include: { sesiones: true },
  });

  let estado: string;
  if (config.sesiones.length === 0) {
    estado = "none";
  } else {
    const obligatorias = config.sesiones.filter((s) => s.tipo === "obligatoria");
    const faltaObjetivo = obligatorias.some((s) => !s.objetivo || !s.objetivo.trim());
    estado = faltaObjetivo ? "partial" : "complete";
  }

  if (estado !== config.estado) {
    await prisma.onboardingConfig.update({ where: { id: config.id }, data: { estado } });
  }
  return estado;
}

export { ESTADO_META } from "@/lib/onboarding-client";
