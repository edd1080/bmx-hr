import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { DocumentoAlcance } from "@/lib/firma";

// Hash del contenido que se firma. Deja constancia auditable de QUÉ se firmó:
// si el documento se editara después, el hash guardado en cada firma no coincidiría.
export function documentoHash(titulo: string, cuerpo: string, archivoNombre?: string | null): string {
  return createHash("sha256")
    .update(`${titulo}\n${cuerpo}\n${archivoNombre ?? ""}`, "utf8")
    .digest("hex");
}

// Datos mínimos de un colaborador para el tablero de cumplimiento.
const AUDIENCE_SELECT = {
  id: true,
  name: true,
  area: true,
  puesto: true,
  employeeCode: true,
} as const;

type DocRef = { id: string; alcance: string; area: string | null };

// Colaboradores ACTIVOS a los que aplica un documento (su audiencia).
export async function getAudienceUsers(doc: DocRef) {
  const alcance = doc.alcance as DocumentoAlcance;
  if (alcance === "TODOS") {
    return prisma.user.findMany({ where: { activo: true }, select: AUDIENCE_SELECT, orderBy: { name: "asc" } });
  }
  if (alcance === "AREA") {
    if (!doc.area) return [];
    return prisma.user.findMany({ where: { activo: true, area: doc.area }, select: AUDIENCE_SELECT, orderBy: { name: "asc" } });
  }
  // SELECCION
  const dest = await prisma.documentoDestinatario.findMany({
    where: { documentoId: doc.id },
    select: { userId: true },
  });
  const ids = dest.map((d) => d.userId);
  if (ids.length === 0) return [];
  return prisma.user.findMany({ where: { id: { in: ids }, activo: true }, select: AUDIENCE_SELECT, orderBy: { name: "asc" } });
}

// ¿Este usuario pertenece a la audiencia del documento? (sin volver a consultar users)
function inAudience(
  doc: { alcance: string; area: string | null; destinatarios: { userId: string }[] },
  userId: string,
  userArea: string | null
): boolean {
  if (doc.alcance === "TODOS") return true;
  if (doc.alcance === "AREA") return !!doc.area && !!userArea && doc.area === userArea;
  return doc.destinatarios.some((d) => d.userId === userId);
}

// Documentos que este colaborador tiene PENDIENTES de firmar (audiencia, sin firma
// previa y aún abiertos). No incluye el cuerpo para mantener ligera la consulta.
export async function getPendingDocsForUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { area: true, activo: true } });
  if (!user || !user.activo) return [];

  const docs = await prisma.documento.findMany({
    where: { cerrado: false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tipo: true,
      titulo: true,
      alcance: true,
      area: true,
      vigencia: true,
      archivoNombre: true,
      createdAt: true,
      author: { select: { name: true } },
      destinatarios: { select: { userId: true } },
      firmas: { where: { userId }, select: { id: true } },
    },
  });

  return docs.filter((d) => d.firmas.length === 0 && inAudience(d, userId, user.area));
}

export async function countPendingForUser(userId: string): Promise<number> {
  const pending = await getPendingDocsForUser(userId);
  return pending.length;
}

// Documentos que este colaborador YA firmó (con la fecha de su acuse).
export async function getSignedDocsForUser(userId: string) {
  return prisma.firma.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      nombreFirma: true,
      documento: {
        select: {
          id: true,
          tipo: true,
          titulo: true,
          vigencia: true,
          archivoNombre: true,
          cerrado: true,
          author: { select: { name: true } },
        },
      },
    },
  });
}

// Tablero de cumplimiento de un documento: quién firmó y quién falta.
export async function getComplianceForDoc(docId: string) {
  const doc = await prisma.documento.findUnique({
    where: { id: docId },
    include: {
      author: { select: { name: true } },
      firmas: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, area: true, puesto: true, employeeCode: true } } },
      },
    },
  });
  if (!doc) return null;

  const audience = await getAudienceUsers(doc);
  const signedIds = new Set(doc.firmas.map((f) => f.userId));
  const pendientes = audience.filter((u) => !signedIds.has(u.id));

  return { doc, audienceTotal: audience.length, firmadas: doc.firmas.length, pendientes };
}
