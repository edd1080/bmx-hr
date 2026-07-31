// NOTE: this module must stay free of server-only imports (e.g. "@/lib/prisma").
// It's imported by client components (nueva-solicitud-modal.tsx) for shared constants/
// formatting — pulling in Prisma here would bundle the native SQLite driver
// into the browser build. DB-touching helpers live in "@/lib/leave-server".

export const LEAVE_TYPES = ["VACATION", "EARLY_FRIDAY", "HALF_DAY"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export const CATEGORIES = ["ADMINISTRATIVO", "OPERATIVO"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  ADMINISTRATIVO: "Administrativo",
  OPERATIVO: "Operativo",
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  VACATION: "Vacaciones",
  EARLY_FRIDAY: "Early Friday",
  HALF_DAY: "Medio día libre",
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

/** Tailwind classes for leave-type chips, matching the corporate design tokens. */
export const LEAVE_TYPE_STYLES: Record<LeaveType, string> = {
  VACATION: "bg-vacation-bg text-vacation-text",
  EARLY_FRIDAY: "bg-earlyfriday-bg text-earlyfriday-text",
  HALF_DAY: "bg-halfday-bg text-halfday-text",
};

/** Solid brand colors per leave type, used for calendar dots and legends. */
export const LEAVE_TYPE_SOLID: Record<LeaveType, string> = {
  VACATION: "bg-brand-accent",
  EARLY_FRIDAY: "bg-brand-primary",
  HALF_DAY: "bg-teal",
};

/** Tailwind classes for status pills. */
export const LEAVE_STATUS_STYLES: Record<LeaveStatus, string> = {
  PENDING: "bg-warning-bg text-warning",
  APPROVED: "bg-success-bg text-success",
  REJECTED: "bg-danger-bg text-danger",
};

/** Vacaciones aplica a todos; Early Friday es exclusivo de administrativos. */
export function availableLeaveTypes(category: string): LeaveType[] {
  if (category === "ADMINISTRATIVO") {
    return ["VACATION", "EARLY_FRIDAY", "HALF_DAY"];
  }
  return ["VACATION", "HALF_DAY"];
}

/** Early Friday y Medio día libre son solicitudes de un solo día. */
export function isSingleDayLeaveType(type: string): boolean {
  return type === "EARLY_FRIDAY" || type === "HALF_DAY";
}

/**
 * Leave dates are calendar dates with no meaningful time-of-day, parsed from
 * "YYYY-MM-DD" strings — which JS interprets as UTC midnight. All date math
 * here uses the UTC getters/setters so it lines up with that parsing instead
 * of drifting a day under non-UTC server timezones.
 */

/** Counts weekdays (Mon-Fri) between two dates, inclusive. */
export function countBusinessDays(start: Date, end: Date): number {
  let count = 0;
  const cursor = new Date(start);
  cursor.setUTCHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setUTCHours(0, 0, 0, 0);

  while (cursor <= last) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) count++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

/** Formats a calendar date (startDate/endDate/hireDate) in the UTC calendar day it represents. */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("es-MX", { timeZone: "UTC" });
}

/** Renders a single date for single-day leave types, or a "start – end" range otherwise. */
export function formatDateRange(start: Date, end: Date): string {
  if (start.getTime() === end.getTime()) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function formatDays(days: number): string {
  return days === 0.5 ? "½" : String(days);
}

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Long-form Spanish date ("2 de julio de 2026") for the UTC calendar day. */
export function formatLongDateEs(date: Date): string {
  return `${date.getUTCDate()} de ${MONTHS_ES[date.getUTCMonth()]} de ${date.getUTCFullYear()}`;
}

const MONTHS_ES_SHORT = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

/** Day-number + 3-letter month, for the small calendar-chip UI ("14" / "JUL"). */
export function formatDayChip(date: Date): { day: number; month: string } {
  return { day: date.getUTCDate(), month: MONTHS_ES_SHORT[date.getUTCMonth()] };
}

/**
 * The Ley Federal del Trabajo ties vacation entitlement to a "año de
 * servicio" that runs from one hire-date anniversary to the next. Given a
 * hire date and the date a vacation is being taken, this returns the bounds
 * of the service-year that request falls in.
 */
export function computeServiceYearPeriod(hireDate: Date, referenceDate: Date) {
  const hireMonth = hireDate.getUTCMonth();
  const hireDay = hireDate.getUTCDate();

  let periodStart = new Date(Date.UTC(referenceDate.getUTCFullYear(), hireMonth, hireDay));
  if (periodStart > referenceDate) {
    periodStart = new Date(Date.UTC(referenceDate.getUTCFullYear() - 1, hireMonth, hireDay));
  }

  const periodEnd = new Date(
    Date.UTC(periodStart.getUTCFullYear() + 1, hireMonth, hireDay)
  );
  periodEnd.setUTCDate(periodEnd.getUTCDate() - 1);

  return { start: periodStart, end: periodEnd };
}
