/**
 * Siembra Direcciones y Posiciones del módulo Onboarding desde el organigrama
 * OFICIAL normalizado (prisma/onboarding-org-data.js → window.BIA_ORG): 10 áreas,
 * 119 posiciones con titular (holder) y "reporta a" (reportsTo).
 *
 * El titular se guarda denormalizado en Posicion.titularNombre porque los User
 * de la app todavía no traen `puesto`. Cuando RH cargue puestos por Excel, se
 * podrá resolver dinámicamente.
 *
 * Idempotente: borra y recrea el catálogo (aún no hay configs/planes).
 *   npx tsx prisma/seed-onboarding.ts
 */
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../src/lib/prisma";

type OrgArea = { key: string; name: string; color: string; people: number; positions: number };
type OrgPos = {
  id: string; name: string; area: string; areaKey: string; depto: string; sub: string;
  nivel: string; count: number; reportsTo: string | null; holder: string | null;
};

function loadOrg(): { areas: OrgArea[]; positions: OrgPos[] } {
  const file = path.join(process.cwd(), "prisma", "onboarding-org-data.js");
  const code = fs.readFileSync(file, "utf8");
  const sandbox = { BIA_ORG: null as unknown } as { BIA_ORG: unknown };
  const window = sandbox;
  void window;
  // El archivo hace `window.BIA_ORG = {...}`. Lo evaluamos con este `window` local.
  eval(code);
  return sandbox.BIA_ORG as { areas: OrgArea[]; positions: OrgPos[] };
}

function norm(s: string): string {
  return s.trim().toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

async function main() {
  const org = loadOrg();
  console.log(`Dataset: ${org.areas.length} áreas, ${org.positions.length} posiciones`);

  // Limpieza (catálogo derivado; aún sin configs/planes reales).
  await prisma.planSesion.deleteMany();
  await prisma.nuevoIngreso.deleteMany();
  await prisma.onboardingSession.deleteMany();
  await prisma.onboardingConfig.deleteMany();
  await prisma.posicion.deleteMany();
  await prisma.direccion.deleteMany();

  // 1) Direcciones.
  const dirIdByName = new Map<string, string>();
  for (const a of org.areas) {
    const d = await prisma.direccion.create({ data: { nombre: a.name, color: a.color.toUpperCase() } });
    dirIdByName.set(a.name, d.id);
  }
  console.log(`Direcciones creadas: ${dirIdByName.size}`);

  // 2) Posiciones (nombre único dentro de su área).
  const posIdByAreaName = new Map<string, string>(); // `${area}::${name}` -> id
  for (const p of org.positions) {
    const areaId = dirIdByName.get(p.area);
    if (!areaId) {
      console.warn(`Área no encontrada para posición ${p.name}: ${p.area}`);
      continue;
    }
    const created = await prisma.posicion.create({
      data: {
        nombre: p.name,
        areaId,
        departamento: p.depto || null,
        subDepartamento: p.sub || null,
        nivelLabel: p.nivel || null,
        headcount: p.count ?? 0,
        titularNombre: p.holder || null,
      },
    });
    posIdByAreaName.set(`${p.area}::${p.name}`, created.id);
  }
  console.log(`Posiciones creadas: ${posIdByAreaName.size}`);

  // 3) reportaA (reportsTo es un NOMBRE de posición; preferimos misma área).
  const byNameGlobal = new Map<string, string>(); // NOMBRE normalizado -> id (último gana)
  for (const p of org.positions) {
    const id = posIdByAreaName.get(`${p.area}::${p.name}`);
    if (id) byNameGlobal.set(norm(p.name), id);
  }
  let enlazados = 0;
  for (const p of org.positions) {
    if (!p.reportsTo) continue;
    const selfId = posIdByAreaName.get(`${p.area}::${p.name}`);
    if (!selfId) continue;
    const sameArea = posIdByAreaName.get(`${p.area}::${p.reportsTo}`);
    const targetId = sameArea ?? byNameGlobal.get(norm(p.reportsTo));
    if (targetId && targetId !== selfId) {
      await prisma.posicion.update({ where: { id: selfId }, data: { reportaAId: targetId } });
      enlazados++;
    }
  }
  console.log(`Posiciones con "reporta a": ${enlazados}`);

  // 4) Gerente N1 por dirección = usuario del área (match case-insensitive) con más reportes directos.
  const users = await prisma.user.findMany({
    where: { activo: true },
    select: { id: true, name: true, area: true, managerId: true },
  });
  const directReports = new Map<string, number>();
  for (const u of users) if (u.managerId) directReports.set(u.managerId, (directReports.get(u.managerId) ?? 0) + 1);
  let n1 = 0;
  for (const a of org.areas) {
    const target = norm(a.name);
    const candidatos = users
      .filter((u) => u.area && norm(u.area) === target)
      .sort((x, y) => (directReports.get(y.id) ?? 0) - (directReports.get(x.id) ?? 0) || x.name.localeCompare(y.name));
    const head = candidatos[0];
    if (head) {
      await prisma.direccion.update({ where: { nombre: a.name }, data: { gerenteN1Id: head.id } });
      n1++;
    }
  }
  console.log(`Gerentes N1 asignados: ${n1}/${org.areas.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
