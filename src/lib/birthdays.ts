import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

// birthDate se guarda como medianoche UTC (igual que hireDate en la importación),
// por lo que leemos siempre los componentes en UTC para evitar corrimientos de día.
export function birthMonth(birthDate: Date): number {
  return birthDate.getUTCMonth() + 1; // 1-12
}

export function birthDay(birthDate: Date): number {
  return birthDate.getUTCDate(); // 1-31
}

/** ¿La fecha de nacimiento cae hoy (mismo mes y día)? */
export function isBirthdayToday(birthDate: Date, today = new Date()): boolean {
  return birthMonth(birthDate) === today.getMonth() + 1 && birthDay(birthDate) === today.getDate();
}

/** ¿El cumpleaños cae dentro del mes en curso? */
export function isBirthdayThisMonth(birthDate: Date, today = new Date()): boolean {
  return birthMonth(birthDate) === today.getMonth() + 1;
}

export type BirthdayPerson = {
  id: string;
  name: string;
  puesto: string | null;
  area: string | null;
  day: number;
};

/** Colaboradores que cumplen años en el mes indicado (1-12), ordenados por día. */
export async function getMonthBirthdays(month: number): Promise<BirthdayPerson[]> {
  const users = await prisma.user.findMany({
    where: { birthDate: { not: null } },
    select: { id: true, name: true, puesto: true, area: true, birthDate: true },
  });

  return users
    .filter((u) => u.birthDate && birthMonth(u.birthDate) === month)
    .map((u) => ({
      id: u.id,
      name: u.name,
      puesto: u.puesto,
      area: u.area,
      day: birthDay(u.birthDate!),
    }))
    .sort((a, b) => a.day - b.day || a.name.localeCompare(b.name));
}

/**
 * Crea (una sola vez por año) la notificación de "Feliz cumpleaños" para el
 * colaborador si hoy es su cumpleaños. La app no tiene cron, así que esto se
 * dispara de forma perezosa cuando la persona abre la app ese día. Se usa
 * relatedRequestId como marca de idempotencia por año (`bday-<año>`).
 */
export async function ensureBirthdayNotification(
  userId: string,
  birthDate: Date | null,
  name: string
): Promise<boolean> {
  if (!birthDate || !isBirthdayToday(birthDate)) return false;

  const marker = `bday-${new Date().getFullYear()}`;
  const already = await prisma.notification.findFirst({
    where: { userId, relatedRequestId: marker },
    select: { id: true },
  });
  if (already) return true;

  const firstName = name.split(" ")[0];
  await notify(
    userId,
    `🎉 ¡Feliz cumpleaños, ${firstName}! Todo el equipo de Café Punta del Cielo te desea un excelente día. 🎂`,
    marker
  );
  return true;
}
