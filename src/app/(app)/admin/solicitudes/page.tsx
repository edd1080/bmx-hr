import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDateRange, formatDays, LEAVE_TYPE_LABELS, LeaveType } from "@/lib/leave";
import { getInitials, getAvatarColors } from "@/lib/avatar";
import { StatusBadge } from "@/components/status-badge";
import { TypeBadge } from "@/components/type-badge";
import { AdminRevisarButton } from "@/components/admin-revisar-button";

const TABS = [
  { key: "pendientes", label: "Pendientes", status: "PENDING" },
  { key: "aprobadas", label: "Aprobadas", status: "APPROVED" },
  { key: "rechazadas", label: "Rechazadas", status: "REJECTED" },
] as const;

export default async function SolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.isHR) redirect("/dashboard");

  const sp = await searchParams;
  const activeTab = TABS.find((t) => t.key === sp.tab) ?? TABS[0];

  const [counts, requests] = await Promise.all([
    Promise.all(
      TABS.map((t) => prisma.leaveRequest.count({ where: { status: t.status } }))
    ),
    prisma.leaveRequest.findMany({
      where: { status: activeTab.status },
      include: {
        user: { select: { id: true, name: true, employeeCode: true, area: true, departamento: true } },
        manager: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
  ]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2.5">
        {TABS.map((t, i) => {
          const active = t.key === activeTab.key;
          return (
            <Link
              key={t.key}
              href={`/admin/solicitudes?tab=${t.key}`}
              className={`rounded-[10px] border-[1.5px] px-[18px] py-2.5 text-[13.5px] font-bold ${
                active
                  ? "border-brand-accent bg-vacation-bg text-vacation-text"
                  : "border-divider bg-surface text-text-muted"
              }`}
            >
              {t.label} · {counts[i]}
            </Link>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-border bg-surface">
        <div className="min-w-[760px]">
        <div className="grid grid-cols-[2fr_1.3fr_1fr_1fr_1.1fr_0.9fr] gap-3 border-b border-border bg-page px-[22px] py-3.5 text-[11.5px] font-bold uppercase tracking-wide text-text-muted-2">
          <span>Colaborador</span>
          <span>Área / Depto.</span>
          <span>Tipo</span>
          <span>Fechas</span>
          <span>Jefe inmediato</span>
          <span className="text-right">Acción</span>
        </div>
        {requests.length === 0 && (
          <div className="px-[22px] py-8 text-center text-sm text-text-muted-3">
            No hay solicitudes en esta categoría.
          </div>
        )}
        {requests.map((r) => {
          const avatar = getAvatarColors(r.user.id);
          return (
            <div
              key={r.id}
              className="grid grid-cols-[2fr_1.3fr_1fr_1fr_1.1fr_0.9fr] items-center gap-3 border-b border-divider px-[22px] py-[15px] last:border-0"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold"
                  style={{ background: avatar.bg, color: avatar.col }}
                >
                  {getInitials(r.user.name)}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-bold text-brand-primary">{r.user.name}</div>
                  <div className="text-[11.5px] text-text-muted-3">#{r.user.employeeCode ?? "—"}</div>
                </div>
              </div>
              <div className="text-[13px] text-text-secondary">
                {r.user.area || "—"}
                <div className="text-[11.5px] text-text-muted-3">{r.user.departamento || ""}</div>
              </div>
              <div>
                <TypeBadge type={r.type} />
              </div>
              <div className="text-[13px] text-text-secondary">
                {formatDateRange(r.startDate, r.endDate)}
                <div className="text-[11.5px] text-text-muted-3">
                  {formatDays(r.days)} {r.days === 1 ? "día" : "días"}
                </div>
              </div>
              <div className="text-[12.5px] text-text-secondary">{r.manager?.name ?? "—"}</div>
              <div className="text-right">
                {r.status === "PENDING" ? (
                  <AdminRevisarButton
                    request={{
                      id: r.id,
                      type: r.type,
                      startDate: r.startDate,
                      endDate: r.endDate,
                      days: r.days,
                      userName: r.user.name,
                      departamento: r.user.departamento,
                    }}
                  />
                ) : r.status === "APPROVED" ? (
                  <a
                    href={`/api/requests/${r.id}/pdf`}
                    target="_blank"
                    className={`inline-block rounded-lg px-3.5 py-1.5 text-xs font-bold ${
                      r.pdfGeneratedAt ? "bg-success-bg text-success" : "bg-brand-accent text-white"
                    }`}
                  >
                    {r.pdfGeneratedAt ? "Ver constancia ✓" : "Registrar"}
                  </a>
                ) : (
                  <StatusBadge status={r.status} />
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
