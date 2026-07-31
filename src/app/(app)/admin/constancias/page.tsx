import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDateRange, formatDays } from "@/lib/leave";
import { getInitials, getAvatarColors } from "@/lib/avatar";
import { TypeBadge } from "@/components/type-badge";

export default async function ConstanciasPage() {
  const session = await auth();
  if (!session?.user?.isHR) redirect("/dashboard");

  const [approved, generatedCount] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { status: "APPROVED" },
      include: { user: { select: { id: true, name: true, employeeCode: true, area: true } } },
      orderBy: { decidedAt: "desc" },
    }),
    prisma.leaveRequest.count({ where: { pdfGeneratedAt: { not: null } } }),
  ]);

  const cumplimiento = approved.length > 0 ? Math.round((generatedCount / approved.length) * 100) : 0;

  return (
    <div>
      <div className="mb-5 flex items-center gap-3 rounded-[14px] border border-[#C9DAFB] bg-vacation-bg px-5 py-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A5CC7" strokeWidth="2">
          <path d="M14 2H6v20h12V8z" />
          <path d="M14 2v6h6" />
        </svg>
        <span className="flex-1 text-[13.5px] text-[#2A4A8C]">
          Genera una constancia por cada solicitud <b>aprobada</b>, lista para firma del colaborador
          y jefe inmediato.
        </span>
        <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-vacation-text">
          Cumplimiento {cumplimiento}%
        </span>
      </div>

      {approved.length === 0 ? (
        <p className="text-sm text-text-muted-3">Aún no hay solicitudes aprobadas.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {approved.map((r) => {
            const avatar = getAvatarColors(r.user.id);
            const done = !!r.pdfGeneratedAt;
            return (
              <div key={r.id} className="rounded-[14px] border border-border bg-surface p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-bold"
                    style={{ background: avatar.bg, color: avatar.col }}
                  >
                    {getInitials(r.user.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-bold text-brand-primary">
                      {r.user.name}
                    </div>
                    <div className="text-xs text-text-muted-3">
                      #{r.user.employeeCode ?? "—"} · {r.user.area || "—"}
                    </div>
                  </div>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <TypeBadge type={r.type} />
                  <span className="rounded-md bg-page px-2.5 py-1 text-xs font-semibold text-text-secondary">
                    {formatDateRange(r.startDate, r.endDate)}
                  </span>
                  <span className="rounded-md bg-page px-2.5 py-1 text-xs font-semibold text-text-secondary">
                    {formatDays(r.days)} {r.days === 1 ? "día" : "días"}
                  </span>
                </div>
                <a
                  href={`/api/requests/${r.id}/pdf`}
                  target="_blank"
                  className={`flex w-full items-center justify-center gap-2 rounded-[9px] py-2.5 text-[13.5px] font-bold ${
                    done ? "bg-success-bg text-success" : "bg-brand-accent text-white"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6v20h12V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  {done ? "Ver constancia ✓" : "Generar constancia"}
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
