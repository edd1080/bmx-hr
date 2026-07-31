import Link from "next/link";
import {
  buildMonthGrid,
  CalendarEntry,
  MONTH_NAMES,
  WEEKDAY_LABELS,
} from "@/lib/calendar";
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_STYLES, LEAVE_TYPE_SOLID, LeaveType } from "@/lib/leave";

export function LeaveCalendar({
  year,
  month,
  entries,
  basePath,
  today,
}: {
  year: number;
  month: number;
  entries: CalendarEntry[];
  basePath: string;
  today?: Date;
}) {
  const days = buildMonthGrid(year, month, entries);
  const prev = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const next = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
  const todayMs = today
    ? Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    : null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`${basePath}?year=${prev.year}&month=${prev.month}`}
          className="rounded-md px-2 py-1 text-[11.5px] font-semibold text-brand-accent hover:bg-brand-accent/10"
        >
          ← Anterior
        </Link>
        <div className="flex flex-wrap gap-3.5 text-[11.5px] text-text-muted">
          {(Object.keys(LEAVE_TYPE_SOLID) as LeaveType[]).map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${LEAVE_TYPE_SOLID[t]}`} />
              {LEAVE_TYPE_LABELS[t]}
            </span>
          ))}
        </div>
        <Link
          href={`${basePath}?year=${next.year}&month=${next.month}`}
          className="rounded-md px-2 py-1 text-[11.5px] font-semibold text-brand-accent hover:bg-brand-accent/10"
        >
          Siguiente →
        </Link>
      </div>

      <div className="mb-2 text-center font-display text-[15px] font-bold text-brand-primary">
        {MONTH_NAMES[month]} {year}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="pb-1 text-center text-[11.5px] font-bold text-text-muted-3">
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          const dayMs = Date.UTC(day.date.getUTCFullYear(), day.date.getUTCMonth(), day.date.getUTCDate());
          const isToday = todayMs !== null && dayMs === todayMs;
          return (
            <div
              key={i}
              className={`min-h-[76px] rounded-[9px] border p-1.5 ${
                isToday ? "border-brand-accent bg-vacation-bg" : "border-divider bg-surface"
              } ${day.inMonth ? "" : "opacity-40"}`}
            >
              <div
                className={`mb-0.5 text-right text-[11.5px] font-bold ${
                  isToday ? "text-vacation-text" : "text-text-secondary"
                }`}
              >
                {day.date.getUTCDate()}
              </div>
              <div className="flex flex-col gap-0.5">
                {day.entries.slice(0, 3).map((e, j) => (
                  <span
                    key={j}
                    title={e.userName}
                    className={`truncate rounded px-1 py-0.5 text-[10px] font-semibold ${
                      LEAVE_TYPE_STYLES[e.type as LeaveType] ?? "bg-page text-text-secondary"
                    } ${e.status === "PENDING" ? "border border-dashed border-current" : ""}`}
                  >
                    {e.userName.split(" ")[0]}
                  </span>
                ))}
                {day.entries.length > 3 && (
                  <span className="text-[10px] font-semibold text-text-muted-3">
                    +{day.entries.length - 3} más
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
