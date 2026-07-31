import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOverlapAlertsGlobal } from "@/lib/leave-server";
import { formatDateRange, LEAVE_TYPES, LEAVE_TYPE_LABELS, LeaveType } from "@/lib/leave";
import { LeaveCalendar } from "@/components/leave-calendar";
import { ExportReportButton } from "@/components/export-report-button";
import { getInitials, getAvatarColors } from "@/lib/avatar";

export default async function AdminPanelPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; area?: string; tipo?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.isHR) redirect("/dashboard");

  const sp = await searchParams;
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const year = sp.year ? parseInt(sp.year) : now.getFullYear();
  const month = sp.month ? parseInt(sp.month) : now.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  const [
    assignedAgg,
    approvedVacationAgg,
    pendingCount,
    registrarCount,
    approvedCount,
    generatedCount,
    alerts,
    areas,
    calendarLeaves,
    nonRejected,
    upcoming,
  ] = await Promise.all([
    prisma.user.aggregate({ _sum: { vacationDaysAssigned: true } }),
    prisma.leaveRequest.aggregate({
      _sum: { days: true },
      where: { type: "VACATION", status: "APPROVED" },
    }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.leaveRequest.count({ where: { status: "APPROVED", pdfGeneratedAt: null } }),
    prisma.leaveRequest.count({ where: { status: "APPROVED" } }),
    prisma.leaveRequest.count({ where: { pdfGeneratedAt: { not: null } } }),
    getOverlapAlertsGlobal(),
    prisma.user.findMany({ where: { area: { not: null } }, select: { area: true }, distinct: ["area"] }),
    prisma.leaveRequest.findMany({
      where: {
        status: { in: ["PENDING", "APPROVED"] },
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
        ...(sp.area ? { user: { area: sp.area } } : {}),
        ...(sp.tipo ? { type: sp.tipo } : {}),
      },
      include: { user: { select: { name: true, area: true, departamento: true } }, manager: { select: { name: true } } },
    }),
    prisma.leaveRequest.findMany({
      where: { status: { not: "REJECTED" } },
      include: { user: { select: { id: true, name: true, area: true } } },
    }),
    prisma.leaveRequest.findMany({
      where: { type: "VACATION", status: { not: "REJECTED" }, startDate: { gte: today } },
      orderBy: { startDate: "asc" },
      take: 5,
      include: { user: { select: { id: true, name: true, area: true } } },
    }),
  ]);

  const dispTotal = (assignedAgg._sum.vacationDaysAssigned ?? 0) - (approvedVacationAgg._sum.days ?? 0);
  const progTotal = approvedVacationAgg._sum.days ?? 0;
  const absPeople = new Set(nonRejected.map((r) => r.userId)).size;
  const cumplimiento = approvedCount > 0 ? Math.round((generatedCount / approvedCount) * 100) : 0;

  const kpis = [
    { label: "Vacaciones disponibles", value: dispTotal, unit: "días", col: "text-brand-primary" },
    { label: "Días programados", value: progTotal, unit: "días", col: "text-brand-primary" },
    { label: "Pendientes de registrar", value: registrarCount, unit: "", col: "text-warning" },
    { label: "Colaboradores con ausencia", value: absPeople, unit: "", col: "text-brand-primary" },
    {
      label: "Cumplimiento de registro",
      value: `${cumplimiento}%`,
      unit: "",
      col: cumplimiento >= 70 ? "text-success" : "text-warning",
    },
    { label: "Alertas críticas", value: alerts.length, unit: "", col: "text-danger" },
  ];

  const areaCount = new Map<string, number>();
  for (const r of nonRejected) {
    const area = r.user.area || "Sin área";
    areaCount.set(area, (areaCount.get(area) ?? 0) + r.days);
  }
  const maxArea = Math.max(1, ...areaCount.values());
  const areaBars = [...areaCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([area, count]) => ({ area, count, pct: Math.round((count / maxArea) * 100) }));

  const filterParts: string[] = [];
  if (sp.area) filterParts.push(sp.area);
  if (sp.tipo) filterParts.push(LEAVE_TYPE_LABELS[sp.tipo as LeaveType] ?? sp.tipo);
  const filterSummary = filterParts.length
    ? `Filtrado por: ${filterParts.join(" · ")}`
    : "Todas las áreas y tipos de ausencia";

  return (
    <div>
      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(185px,1fr))] gap-3.5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-[14px] border border-border bg-surface p-[17px]">
            <div className="mb-2 text-xs font-semibold leading-tight text-text-muted-2">{k.label}</div>
            <div className="flex items-baseline gap-1.5">
              <span className={`font-display text-[27px] font-extrabold leading-none ${k.col}`}>
                {k.value}
              </span>
              {k.unit && <span className="text-xs text-text-muted-3">{k.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      <form
        method="get"
        className="mb-5 flex flex-wrap items-center gap-4 rounded-[14px] border border-border bg-surface px-5 py-4"
      >
        <span className="flex items-center gap-2 text-[13px] font-bold text-text-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A88FA" strokeWidth="2">
            <path d="M3 5h18l-7 8v6l-4-2v-4z" />
          </svg>
          Filtros
        </span>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-text-muted-3">Área</label>
          <select
            name="area"
            defaultValue={sp.area || ""}
            className="min-w-[150px] rounded-lg border-[1.5px] border-border-input px-3 py-2 text-[13px] text-brand-primary"
          >
            <option value="">Todas</option>
            {areas.map((a) => a.area && <option key={a.area} value={a.area}>{a.area}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-text-muted-3">Tipo</label>
          <select
            name="tipo"
            defaultValue={sp.tipo || ""}
            className="min-w-[150px] rounded-lg border-[1.5px] border-border-input px-3 py-2 text-[13px] text-brand-primary"
          >
            <option value="">Todos</option>
            {LEAVE_TYPES.map((t) => (
              <option key={t} value={t}>
                {LEAVE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border-[1.5px] border-border-input px-4 py-2 text-[13px] font-bold text-text-secondary"
        >
          Aplicar
        </button>
        <ExportReportButton
          rows={calendarLeaves.map((l) => ({
            nombre: l.user.name,
            area: l.user.area,
            departamento: l.user.departamento,
            tipo: l.type,
            startDate: l.startDate,
            endDate: l.endDate,
            dias: l.days,
            jefe: l.manager?.name ?? null,
            estatus: l.status,
          }))}
        />
      </form>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[14px] border border-border bg-surface p-5">
          <h3 className="font-display text-[16.5px] font-bold text-brand-primary">
            Calendario consolidado
          </h3>
          <p className="mb-4 mt-0.5 text-xs text-text-muted-3">{filterSummary}</p>
          <LeaveCalendar
            year={year}
            month={month}
            basePath="/admin"
            today={today}
            entries={calendarLeaves.map((l) => ({
              userName: l.user.name,
              type: l.type,
              status: l.status,
              startDate: l.startDate,
              endDate: l.endDate,
            }))}
          />
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-[14px] border border-border bg-surface p-5">
            <h3 className="mb-4 font-display text-base font-bold text-brand-primary">
              Ausencias por área
            </h3>
            <div className="flex flex-col gap-3.5">
              {areaBars.length === 0 && (
                <p className="text-sm text-text-muted-3">Sin ausencias registradas.</p>
              )}
              {areaBars.map((a) => (
                <div key={a.area}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span className="font-semibold text-brand-primary">{a.area}</span>
                    <span className="font-semibold text-text-muted-2">{a.count} días</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-divider">
                    <div className="h-full rounded-full bg-brand-accent" style={{ width: `${a.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[14px] border border-border bg-surface p-5">
            <h3 className="mb-3.5 font-display text-base font-bold text-brand-primary">
              Próximas vacaciones
            </h3>
            <div className="flex flex-col gap-3">
              {upcoming.length === 0 && (
                <p className="text-sm text-text-muted-3">Sin vacaciones próximas.</p>
              )}
              {upcoming.map((r) => {
                const avatar = getAvatarColors(r.user.id);
                return (
                  <div key={r.id} className="flex items-center gap-2.5">
                    <span
                      className="font-display flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg text-[13px] font-bold"
                      style={{ background: avatar.bg, color: avatar.col }}
                    >
                      {getInitials(r.user.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold text-brand-primary">
                        {r.user.name}
                      </div>
                      <div className="text-xs text-text-muted-2">{r.user.area}</div>
                    </div>
                    <span className="whitespace-nowrap text-xs font-bold text-brand-accent">
                      {formatDateRange(r.startDate, r.endDate)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
