import { prisma } from "@/lib/prisma";
import { getCurrentCiclo, isValidAvancePct, isValidMes } from "@/lib/metas";

export async function getMetasForUser(userId: string, ciclo: number = getCurrentCiclo()) {
  return prisma.meta.findMany({
    where: { userId, ciclo },
    include: { avances: { orderBy: { mes: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getTeamMetas(managerId: string, ciclo: number = getCurrentCiclo()) {
  return prisma.meta.findMany({
    where: { managerId, ciclo },
    include: {
      user: { select: { id: true, name: true, puesto: true } },
      avances: { orderBy: { mes: "asc" } },
    },
    orderBy: [{ user: { name: "asc" } }, { createdAt: "asc" }],
  });
}

/** Todas las metas de la compañía en un ciclo, para la vista de Gente y Gestión. */
export async function getAllCompanyMetas(ciclo: number = getCurrentCiclo()) {
  return prisma.meta.findMany({
    where: { ciclo },
    include: {
      user: { select: { id: true, name: true, puesto: true, area: true, departamento: true } },
      manager: { select: { name: true } },
      avances: { orderBy: { mes: "asc" } },
    },
    orderBy: [{ user: { name: "asc" } }, { createdAt: "asc" }],
  });
}

/**
 * Registra o actualiza el avance de un mes. Solo aplica a metas Aprobadas —
 * antes de eso no hay nada bloqueado sobre lo que reportar avance.
 */
export async function upsertMetaAvance(
  metaId: string,
  mes: number,
  avancePct: number,
  comentario: string | null
) {
  if (!isValidMes(mes)) throw new Error("Mes inválido.");
  if (!isValidAvancePct(avancePct)) throw new Error("El avance debe ser un porcentaje entero de 0 a 100.");

  return prisma.metaAvance.upsert({
    where: { metaId_mes: { metaId, mes } },
    update: { avancePct, comentario },
    create: { metaId, mes, avancePct, comentario },
  });
}

export async function getPendingMetaReviewCount(managerId: string): Promise<number> {
  return prisma.meta.count({ where: { managerId, estado: "EN_REVISION" } });
}

/** Todas las metas (cualquier estado) de un usuario en un ciclo — para validar que sumen 100%. */
export async function getAllMetasForCiclo(userId: string, ciclo: number) {
  return prisma.meta.findMany({ where: { userId, ciclo } });
}

export async function hasApprovedMetaForCiclo(userId: string, ciclo: number): Promise<boolean> {
  const count = await prisma.meta.count({ where: { userId, ciclo, estado: "APROBADA" } });
  return count > 0;
}
