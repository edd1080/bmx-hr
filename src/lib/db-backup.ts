import path from "node:path";
import fs from "node:fs";
import { prisma } from "@/lib/prisma";

// Carpeta donde viven los respaldos (misma que ya usaba el proyecto).
const BACKUPS_DIR = path.join(process.cwd(), "backups");

/**
 * Crea un respaldo consistente de la base SQLite ANTES de una operación
 * riesgosa (como aplicar una importación). Usa `VACUUM INTO`, que genera una
 * copia limpia en una sola transacción, aunque la app siga en uso.
 *
 * Devuelve el nombre del archivo de respaldo (dentro de backups/).
 */
export async function backupDatabase(tag: string): Promise<string> {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });

  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "")
    .replace("T", "-")
    .slice(0, 15); // AAAAMMDD-HHMMSS aprox.
  const safeTag = tag.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 40) || "backup";
  const fileName = `dev-${safeTag}-${stamp}.db`;
  const dest = path.join(BACKUPS_DIR, fileName);

  // VACUUM INTO exige una ruta literal (no admite parámetros). La ruta la
  // generamos nosotros (sin entrada del usuario), así que no hay inyección.
  // Escapamos comillas simples por seguridad de sintaxis SQLite.
  const escaped = dest.replace(/'/g, "''");
  await prisma.$executeRawUnsafe(`VACUUM INTO '${escaped}'`);

  return fileName;
}
