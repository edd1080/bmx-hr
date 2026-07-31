export type CalendarEntry = {
  userName: string;
  type: string;
  status: string;
  startDate: Date;
  endDate: Date;
};

export type CalendarDay = {
  date: Date;
  inMonth: boolean;
  entries: CalendarEntry[];
};

// Grid days and leave request boundaries are both represented as UTC-midnight
// Date objects so they compare correctly regardless of the server's local
// timezone (leave dates come from "YYYY-MM-DD" input, parsed as UTC midnight).
function toDateOnly(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Builds a 6-week (42 day) grid for the given month, starting on Monday. */
export function buildMonthGrid(
  year: number,
  month: number,
  entries: CalendarEntry[]
): CalendarDay[] {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const firstWeekday = (firstOfMonth.getUTCDay() + 6) % 7; // 0 = Monday
  const gridStart = new Date(Date.UTC(year, month, 1 - firstWeekday));

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + i);

    const dayEntries = entries.filter((e) => {
      const start = toDateOnly(e.startDate);
      const end = toDateOnly(e.endDate);
      return date >= start && date <= end;
    });

    days.push({ date, inMonth: date.getUTCMonth() === month, entries: dayEntries });
  }
  return days;
}

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
