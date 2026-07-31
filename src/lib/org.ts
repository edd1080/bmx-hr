// NOTE: this module must stay free of server-only imports (e.g. "@/lib/prisma") —
// it's imported by the client component that browses the org chart in-memory.
// DB-touching helpers live in "@/lib/org-server".

export type OrgPerson = {
  id: string;
  employeeCode: string | null;
  name: string;
  puesto: string | null;
  area: string | null;
  departamento: string | null;
  email: string | null;
  telefono: string | null;
  category: string;
  hireDate: Date | null;
  managerId: string | null;
  directReportCount: number;
  downstreamHeadcount: number;
};

/** Ancestor chain from the top of the company down to (and including) `focusId`. */
export function getAncestorChain(people: OrgPerson[], focusId: string): OrgPerson[] {
  const byId = new Map(people.map((p) => [p.id, p]));
  const chain: OrgPerson[] = [];
  let current = byId.get(focusId);
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    chain.unshift(current);
    seen.add(current.id);
    current = current.managerId ? byId.get(current.managerId) : undefined;
  }
  return chain;
}

/** Everyone who reports directly to `managerId`, largest team first. */
export function getDirectReports(people: OrgPerson[], managerId: string): OrgPerson[] {
  return people
    .filter((p) => p.managerId === managerId)
    .sort((a, b) => b.downstreamHeadcount - a.downstreamHeadcount || a.name.localeCompare(b.name));
}

export function getDepartamentos(people: OrgPerson[]): string[] {
  const set = new Set(people.map((p) => p.departamento).filter((d): d is string => !!d));
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function searchPeople(
  people: OrgPerson[],
  query: string,
  departamento: string | null
): OrgPerson[] {
  const q = query.trim().toLowerCase();
  return people
    .filter((p) => {
      const deptOk = !departamento || p.departamento === departamento;
      const textOk =
        !q || p.name.toLowerCase().includes(q) || (p.puesto ?? "").toLowerCase().includes(q);
      return deptOk && textOk;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
