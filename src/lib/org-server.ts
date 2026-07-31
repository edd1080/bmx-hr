import { prisma } from "@/lib/prisma";
import type { OrgPerson } from "@/lib/org";

/**
 * Loads every colaborador once and builds the org tree in memory (~320 rows —
 * cheap enough that the client component never needs to fetch again while browsing).
 */
export async function getOrgDirectory(): Promise<{ people: OrgPerson[]; rootIds: string[] }> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      employeeCode: true,
      name: true,
      puesto: true,
      area: true,
      departamento: true,
      email: true,
      telefono: true,
      category: true,
      hireDate: true,
      managerId: true,
    },
    orderBy: { name: "asc" },
  });

  const idSet = new Set(users.map((u) => u.id));

  // Normalize manager references: a managerId pointing to a non-existent user,
  // or to the person themselves, is treated as "no manager" — both are data-entry
  // gaps, not real hierarchy (we've seen a real case of someone set as their own boss).
  const normalizedManagerId = new Map<string, string | null>();
  for (const u of users) {
    const raw = u.managerId;
    normalizedManagerId.set(u.id, raw && raw !== u.id && idSet.has(raw) ? raw : null);
  }

  // Defensive: break any remaining cycle (A ultimately reports to someone who,
  // several links up, reports back to A) by cutting the link where it's first revisited.
  for (const u of users) {
    const seen = new Set<string>([u.id]);
    let cursor = normalizedManagerId.get(u.id) ?? null;
    while (cursor) {
      if (seen.has(cursor)) {
        normalizedManagerId.set(u.id, null);
        break;
      }
      seen.add(cursor);
      cursor = normalizedManagerId.get(cursor) ?? null;
    }
  }

  const childrenOf = new Map<string, string[]>();
  for (const u of users) {
    const managerId = normalizedManagerId.get(u.id);
    if (managerId) {
      const arr = childrenOf.get(managerId) ?? [];
      arr.push(u.id);
      childrenOf.set(managerId, arr);
    }
  }

  const downstreamMemo = new Map<string, number>();
  function downstreamHeadcount(id: string, visiting: Set<string> = new Set()): number {
    const cached = downstreamMemo.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return 0; // last-resort guard; should be unreachable after cycle-breaking above
    visiting.add(id);
    const kids = childrenOf.get(id) ?? [];
    const total = kids.reduce((sum, kidId) => sum + 1 + downstreamHeadcount(kidId, visiting), 0);
    visiting.delete(id);
    downstreamMemo.set(id, total);
    return total;
  }

  const people: OrgPerson[] = users.map((u) => ({
    id: u.id,
    employeeCode: u.employeeCode,
    name: u.name,
    puesto: u.puesto,
    area: u.area,
    departamento: u.departamento,
    email: u.email,
    telefono: u.telefono,
    category: u.category,
    hireDate: u.hireDate,
    managerId: normalizedManagerId.get(u.id) ?? null,
    directReportCount: (childrenOf.get(u.id) ?? []).length,
    downstreamHeadcount: downstreamHeadcount(u.id),
  }));

  const rootIds = people
    .filter((p) => !p.managerId)
    .sort((a, b) => b.downstreamHeadcount - a.downstreamHeadcount)
    .map((p) => p.id);

  return { people, rootIds };
}
