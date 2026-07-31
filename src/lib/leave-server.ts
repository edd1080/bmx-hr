import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/leave";

export async function getVacationBalance(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const approvedVacations = await prisma.leaveRequest.findMany({
    where: { userId, type: "VACATION", status: "APPROVED" },
    select: { days: true },
  });
  const used = approvedVacations.reduce((sum, r) => sum + r.days, 0);
  return {
    assigned: user.vacationDaysAssigned,
    used,
    available: user.vacationDaysAssigned - used,
  };
}

export async function isManager(userId: string): Promise<boolean> {
  const reportsCount = await prisma.user.count({ where: { managerId: userId } });
  return reportsCount > 0;
}

export type OverlapAlert = {
  departamento: string;
  text: string;
};

/**
 * Flags departments where 2+ Operativos on this manager's team are absent
 * (pending or approved) on the same calendar day — a coverage risk for
 * shift-based roles.
 */
export async function getOverlapAlerts(managerId: string): Promise<OverlapAlert[]> {
  const team = await prisma.user.findMany({
    where: { managerId, category: "OPERATIVO" },
    select: { id: true, name: true, departamento: true },
  });
  return computeOverlapAlerts(team);
}

/** Same as {@link getOverlapAlerts} but scoped to every Operativo in the company. */
export async function getOverlapAlertsGlobal(): Promise<OverlapAlert[]> {
  const all = await prisma.user.findMany({
    where: { category: "OPERATIVO" },
    select: { id: true, name: true, departamento: true },
  });
  return computeOverlapAlerts(all);
}

async function computeOverlapAlerts(
  team: { id: string; name: string; departamento: string | null }[]
): Promise<OverlapAlert[]> {
  if (team.length === 0) return [];

  const teamById = new Map(team.map((t) => [t.id, t]));
  const requests = await prisma.leaveRequest.findMany({
    where: { userId: { in: team.map((t) => t.id) }, status: { in: ["PENDING", "APPROVED"] } },
    select: { userId: true, startDate: true, endDate: true },
  });

  // key: "departamento|epochMs of day" -> first names absent that day
  const byDepDay = new Map<string, Set<string>>();

  for (const r of requests) {
    const member = teamById.get(r.userId);
    if (!member) continue;
    const dep = member.departamento || "Sin departamento";
    const cursor = new Date(r.startDate);
    cursor.setUTCHours(0, 0, 0, 0);
    const last = new Date(r.endDate);
    last.setUTCHours(0, 0, 0, 0);
    while (cursor <= last) {
      const key = `${dep}|${cursor.getTime()}`;
      const names = byDepDay.get(key) ?? new Set<string>();
      names.add(member.name.split(" ")[0]);
      byDepDay.set(key, names);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  const byDep = new Map<string, { days: number[]; names: Set<string> }>();
  for (const [key, names] of byDepDay) {
    if (names.size < 2) continue;
    const [dep, dayMs] = key.split("|");
    const agg = byDep.get(dep) ?? { days: [], names: new Set<string>() };
    agg.days.push(Number(dayMs));
    names.forEach((n) => agg.names.add(n));
    byDep.set(dep, agg);
  }

  const alerts: OverlapAlert[] = [];
  for (const [dep, agg] of byDep) {
    const min = new Date(Math.min(...agg.days));
    const max = new Date(Math.max(...agg.days));
    const rango =
      min.getTime() === max.getTime() ? formatDate(min) : `${formatDate(min)} – ${formatDate(max)}`;
    alerts.push({
      departamento: dep,
      text: `${agg.names.size} colaboradores operativos ausentes el ${rango} — ${[...agg.names].join(", ")}. Revisa la cobertura del turno.`,
    });
  }
  return alerts;
}

/** Assigns a stable "MG-{año}-####" folio the first time a constancia is generated (concurrency-safe with retry). */
export async function ensureFolio(requestId: string): Promise<string> {
  const request = await prisma.leaveRequest.findUniqueOrThrow({ where: { id: requestId } });
  if (request.folio) return request.folio;

  const year = new Date().getUTCFullYear();
  let attempt = 0;
  while (attempt < 5) {
    attempt++;
    const countThisYear = await prisma.leaveRequest.count({
      where: { folio: { startsWith: `MG-${year}-` } },
    });
    const folioCandidate = `MG-${year}-${String(countThisYear + attempt).padStart(4, "0")}`;

    try {
      const updated = await prisma.leaveRequest.update({
        where: { id: requestId },
        data: { folio: folioCandidate, pdfGeneratedAt: new Date() },
      });
      return updated.folio!;
    } catch {
      const current = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
      if (current?.folio) return current.folio;
    }
  }

  const fallbackFolio = `MG-${year}-${requestId.slice(-6).toUpperCase()}`;
  await prisma.leaveRequest.update({
    where: { id: requestId },
    data: { folio: fallbackFolio, pdfGeneratedAt: new Date() },
  });
  return fallbackFolio;
}
