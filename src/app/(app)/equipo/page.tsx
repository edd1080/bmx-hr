import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getVacationBalance, getOverlapAlerts } from "@/lib/leave-server";
import { LeaveCalendar } from "@/components/leave-calendar";
import { PendingApprovalRow } from "@/components/pending-approval-row";

export default async function EquipoPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;

  const team = await prisma.user.findMany({
    where: { managerId: userId },
    select: { id: true, name: true, area: true, departamento: true, category: true },
  });

  if (team.length === 0) {
    redirect("/dashboard");
  }
  const teamIds = team.map((t) => t.id);

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const sp = await searchParams;
  const year = sp.year ? parseInt(sp.year) : now.getFullYear();
  const month = sp.month ? parseInt(sp.month) : now.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  const [pending, teamLeaves, ausentesHoyCount, alerts, teamBalances] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { managerId: userId, status: "PENDING" },
      include: { user: { select: { id: true, name: true, area: true, departamento: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.leaveRequest.findMany({
      where: {
        userId: { in: teamIds },
        status: { in: ["PENDING", "APPROVED"] },
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
      },
      include: { user: { select: { name: true } } },
    }),
    prisma.leaveRequest.count({
      where: { userId: { in: teamIds }, status: "APPROVED", startDate: { lte: today }, endDate: { gte: today } },
    }),
    getOverlapAlerts(userId),
    Promise.all(team.map((t) => getVacationBalance(t.id))),
  ]);

  const dispPct = Math.round(((team.length - ausentesHoyCount) / team.length) * 100);

  const kpis = [
    { label: "Pendientes de aprobar", value: pending.length, sub: "requieren tu acción", border: "border-l-warning" },
    { label: "Ausentes hoy", value: ausentesHoyCount, sub: `de ${team.length} colaboradores`, border: "border-l-brand-accent" },
    { label: "Disponibilidad hoy", value: `${dispPct}%`, sub: "equipo activo", border: "border-l-success" },
    { label: "Alertas de solapamiento", value: alerts.length, sub: "cobertura operativa", border: "border-l-danger" },
  ];

  const teamAvail = team.map((t, i) => {
    const bal = teamBalances[i];
    const pct = bal.assigned > 0 ? Math.round((bal.available / bal.assigned) * 100) : 0;
    const color = pct > 50 ? "bg-success" : pct > 25 ? "bg-warning" : "bg-danger";
    return { id: t.id, name: t.name.split(" ")[0], available: bal.available, assigned: bal.assigned, pct, color };
  });

  return (
    <div>
      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`rounded-[14px] border border-border border-l-4 bg-surface p-[19px] shadow-sm ${k.border}`}>
            <div className="mb-2 text-[12.5px] font-semibold text-text-muted-2">{k.label}</div>
            <div className="font-display text-[30px] font-extrabold leading-none text-brand-primary">
              {k.value}
            </div>
            <div className="mt-1.5 text-xs text-text-muted-3">{k.sub}</div>
          </div>
        ))}
      </div>

      {alerts.length > 0 && (
        <div className="mb-5 rounded-[14px] border border-warning-bg bg-warning-bg px-5 py-4">
          <div className="mb-3 flex items-center gap-2 text-warning">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3l9 16H3z" />
              <path d="M12 10v4M12 17h.01" />
            </svg>
            <h3 className="font-display text-[15.5px] font-bold">
              Alertas de solapamiento operativo
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {alerts.map((a) => (
              <div key={a.departamento} className="flex items-center gap-3 rounded-lg bg-surface px-3.5 py-2.5">
                <span className="shrink-0 rounded-md bg-warning-bg px-2.5 py-1 text-[11px] font-bold text-warning">
                  {a.departamento}
                </span>
                <span className="flex-1 text-[13.5px] text-text-secondary">{a.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-5">
          <div className="rounded-[14px] border border-border bg-surface p-5">
            <LeaveCalendar
              year={year}
              month={month}
              basePath="/equipo"
              today={today}
              entries={teamLeaves.map((l) => ({
                userName: l.user.name,
                type: l.type,
                status: l.status,
                startDate: l.startDate,
                endDate: l.endDate,
              }))}
            />
          </div>

          <div className="rounded-[14px] border border-border bg-surface p-5">
            <h3 className="mb-4 font-display text-[16.5px] font-bold text-brand-primary">
              Solicitudes pendientes de tu aprobación
            </h3>
            {pending.length === 0 ? (
              <p className="text-[13.5px] text-text-muted-3">
                No hay solicitudes pendientes. Todo al día. ✓
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {pending.map((r) => (
                  <PendingApprovalRow
                    key={r.id}
                    request={{
                      id: r.id,
                      type: r.type,
                      startDate: r.startDate,
                      endDate: r.endDate,
                      days: r.days,
                      userId: r.user.id,
                      userName: r.user.name,
                      area: r.user.area,
                      departamento: r.user.departamento,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[14px] border border-border bg-surface p-5">
          <h3 className="font-display text-[16.5px] font-bold text-brand-primary">
            Disponibilidad del equipo
          </h3>
          <p className="mb-4 mt-0.5 text-xs text-text-muted-3">Días de vacaciones restantes</p>
          <div className="flex flex-col gap-4">
            {teamAvail.map((m) => (
              <div key={m.id}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${m.color}`} />
                    <span className="truncate text-[13.5px] font-semibold text-brand-primary">
                      {m.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-text-muted-2">
                    {m.available}/{m.assigned}
                  </span>
                </div>
                <div className="h-[7px] overflow-hidden rounded-full bg-divider">
                  <div className={`h-full rounded-full ${m.color}`} style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
