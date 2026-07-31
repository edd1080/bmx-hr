import { prisma } from "@/lib/prisma";

// Normaliza para emparejar (mayúsculas, sin acentos, espacios colapsados).
export function normKey(s: string): string {
  return s.trim().toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");
}

const CONECTORES = new Set(["de", "del", "la", "las", "los", "y", "e", "o", "en", "a"]);
function titleCase(s: string): string {
  const words = s.trim().toLowerCase().replace(/\s+/g, " ").split(" ");
  return words
    .map((w, i) => (i > 0 && CONECTORES.has(w) ? w : w.replace(/^([a-záéíóúñ])/, (m) => m.toUpperCase())))
    .join(" ");
}

function colorForArea(nombre: string): string {
  const s = nombre.toLowerCase();
  if (s.includes("comercial")) return "#4A88FA";
  if (s.includes("log") || s.includes("opera")) return "#2F8F8A";
  if (s.includes("finan")) return "#2C4A7A";
  if (s.includes("gente") || s.includes("gestion") || s.includes("rh")) return "#7A6FC0";
  if (s.includes("marketing") || s.includes("mercado")) return "#2F9FB0";
  if (s.includes("legal") || s.includes("jur")) return "#8A6FA8";
  if (s.includes("revenue") || s.includes("bi")) return "#3F5BD0";
  if (s.includes("compra")) return "#5A7A9A";
  if (s.includes("manufactura") || s.includes("producc")) return "#B5762E";
  return "#1C3565";
}

export type OrgRow = {
  nombre: string;
  puesto: string;
  nivel: string;
  departamento: string;
  area: string;
  sub: string;
  posicionJefe: string;
};

// Toma el objeto crudo del Excel/CSV y lee las columnas por nombre (tolerante).
export function parseOrgRow(raw: Record<string, unknown>): OrgRow {
  const g = (...keys: string[]): string => {
    for (const k of keys) {
      const found = Object.keys(raw).find((rk) => normKey(rk) === normKey(k));
      if (found) return String(raw[found] ?? "").trim();
    }
    return "";
  };
  return {
    nombre: g("NOMBRE COMPLETO", "Nombre"),
    puesto: g("PUESTO", "Puesto"),
    nivel: g("Nivel de puesto", "Nivel"),
    departamento: g("Departamento"),
    area: g("Área", "Area"),
    sub: g("Sub-departamento", "Subdepartamento"),
    posicionJefe: g("Posición de Jefe Inmediato", "Posicion de Jefe Inmediato"),
  };
}

export type ImportResult = {
  direccionesNuevas: number;
  posicionesNuevas: number;
  posicionesActualizadas: number;
  reportaAsignados: number;
  filas: number;
  errores: string[];
};

/**
 * Upsert del catálogo desde filas del organigrama. NUNCA borra: solo crea o
 * actualiza (así se conservan las configuraciones de onboarding existentes).
 * Empareja direcciones y posiciones por clave normalizada para no duplicar.
 */
export async function importOrganigrama(rows: OrgRow[]): Promise<ImportResult> {
  const res: ImportResult = {
    direccionesNuevas: 0,
    posicionesNuevas: 0,
    posicionesActualizadas: 0,
    reportaAsignados: 0,
    filas: rows.length,
    errores: [],
  };

  const valid = rows.filter((r) => r.puesto && r.area);

  // Direcciones existentes por clave normalizada.
  const dirs = await prisma.direccion.findMany({ select: { id: true, nombre: true } });
  const dirByKey = new Map(dirs.map((d) => [normKey(d.nombre), d.id]));

  for (const area of new Set(valid.map((r) => r.area))) {
    const k = normKey(area);
    if (!dirByKey.has(k)) {
      const d = await prisma.direccion.create({ data: { nombre: titleCase(area), color: colorForArea(area) } });
      dirByKey.set(k, d.id);
      res.direccionesNuevas++;
    }
  }

  // Titular (primer nombre visto) y headcount por (área, puesto).
  const holderByPos = new Map<string, string>();
  const countByPos = new Map<string, number>();
  for (const r of valid) {
    const pk = `${normKey(r.area)}::${normKey(r.puesto)}`;
    if (r.nombre && !holderByPos.has(pk)) holderByPos.set(pk, titleCase(r.nombre));
    countByPos.set(pk, (countByPos.get(pk) ?? 0) + 1);
  }

  // Posiciones existentes por clave (areaId::nombreNorm).
  const posRows = await prisma.posicion.findMany({ select: { id: true, nombre: true, areaId: true } });
  const posByKey = new Map(posRows.map((p) => [`${p.areaId}::${normKey(p.nombre)}`, p.id]));
  // Índice global por nombre normalizado para resolver "reporta a".
  const posByName = new Map(posRows.map((p) => [normKey(p.nombre), p.id]));

  const distinctPos = new Map<string, OrgRow>();
  for (const r of valid) {
    const pk = `${normKey(r.area)}::${normKey(r.puesto)}`;
    if (!distinctPos.has(pk)) distinctPos.set(pk, r);
  }

  for (const [pk, r] of distinctPos) {
    const areaId = dirByKey.get(normKey(r.area))!;
    const key = `${areaId}::${normKey(r.puesto)}`;
    const data = {
      departamento: r.departamento ? titleCase(r.departamento) : null,
      subDepartamento: r.sub ? titleCase(r.sub) : null,
      nivelLabel: r.nivel || null,
      titularNombre: holderByPos.get(pk) ?? null,
      headcount: countByPos.get(pk) ?? 0,
    };
    const existingId = posByKey.get(key);
    if (existingId) {
      await prisma.posicion.update({ where: { id: existingId }, data });
      res.posicionesActualizadas++;
    } else {
      const created = await prisma.posicion.create({ data: { nombre: titleCase(r.puesto), areaId, ...data } });
      posByKey.set(key, created.id);
      posByName.set(normKey(r.puesto), created.id);
      res.posicionesNuevas++;
    }
  }

  // Segunda pasada: reporta a (por "Posición de Jefe Inmediato").
  for (const [, r] of distinctPos) {
    if (!r.posicionJefe) continue;
    const areaId = dirByKey.get(normKey(r.area))!;
    const selfId = posByKey.get(`${areaId}::${normKey(r.puesto)}`);
    const targetId = posByName.get(normKey(r.posicionJefe));
    if (selfId && targetId && selfId !== targetId) {
      await prisma.posicion.update({ where: { id: selfId }, data: { reportaAId: targetId } });
      res.reportaAsignados++;
    }
  }

  return res;
}
