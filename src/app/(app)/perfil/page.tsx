import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  LEAVE_TYPE_LABELS,
  formatDate,
  formatDateRange,
  formatDayChip,
  formatDays,
  LeaveType,
} from "@/lib/leave";
import { getVacationBalance } from "@/lib/leave-server";
import { getInitials, getAvatarColors } from "@/lib/avatar";
import { NuevaSolicitudButton } from "@/components/nueva-solicitud-button";
import { StatusBadge } from "@/components/status-badge";
import { PdfLink } from "@/components/pdf-link";
import { BirthdayEditor } from "@/components/birthday-editor";
import { ThemeSwitch } from "@/components/theme-toggle";
import { PushToggle } from "@/components/push-toggle";

export default async function PerfilPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, reportsCount, balance, requests] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { manager: { select: { name: true } } },
    }),
    prisma.user.count({ where: { managerId: userId } }),
    getVacationBalance(userId),
    prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const avatar = getAvatarColors(user.id);

  const birthIso = user.birthDate
    ? `${user.birthDate.getUTCFullYear()}-${String(user.birthDate.getUTCMonth() + 1).padStart(2, "0")}-${String(user.birthDate.getUTCDate()).padStart(2, "0")}`
    : null;

  const fields: { label: string; value: string | null }[] = [
    { label: "Código de empleado", value: user.employeeCode },
    { label: "Puesto", value: user.puesto },
    {
      label: "Área / Departamento",
      value: [user.area, user.departamento].filter(Boolean).join(" · ") || null,
    },
    { label: "Categoría", value: user.category === "OPERATIVO" ? "Operativo" : "Administrativo" },
    { label: "Correo", value: user.email },
    { label: "Teléfono", value: user.telefono },
    { label: "CURP", value: user.curp },
    { label: "Fecha de ingreso", value: user.hireDate ? formatDate(user.hireDate) : null },
    { label: "Jefe inmediato", value: user.manager?.name ?? "Sin jefe asignado" },
    { label: "Equipo a cargo", value: `${reportsCount} colaborador${reportsCount === 1 ? "" : "es"}` },
  ];

  const now = new Date();
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const upcoming = requests
    .filter((r) => r.status !== "REJECTED" && r.startDate.getTime() >= now.getTime())
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const nextVacation = upcoming.find((r) => r.type === "VACATION");
  const dispPct = balance.assigned > 0 ? Math.round((balance.available / balance.assigned) * 100) : 0;

  const kpis = [
    {
      label: "Días disponibles",
      value: String(balance.available),
      sub: `de ${balance.assigned} asignados`,
      icon: "🌴",
      bg: "bg-vacation-bg",
      col: "text-vacation-text",
    },
    {
      label: "Días programados",
      value: String(balance.used),
      sub: "vacaciones aprobadas",
      icon: "📅",
      bg: "bg-teal-bg",
      col: "text-teal",
    },
    {
      label: "Solicitudes pendientes",
      value: String(pendingCount),
      sub: "en revisión",
      icon: "⏳",
      bg: "bg-warning-bg",
      col: "text-warning",
    },
    {
      label: "Próxima ausencia",
      value: nextVacation ? formatDateRange(nextVacation.startDate, nextVacation.endDate) : "—",
      sub: nextVacation ? "vacaciones" : "sin programar",
      icon: "✈",
      bg: "bg-tint-purple-bg",
      col: "text-tint-purple-fg",
    },
  ];

  return (
    <div>
      <h1 className="font-display mb-6 text-[23px] font-bold text-brand-primary">Mi Perfil</h1>

      <div className="max-w-[720px] rounded-[14px] border border-border bg-surface p-6">
        <div
          className="font-display mb-3 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold"
          style={{ background: avatar.bg, color: avatar.col }}
        >
          {getInitials(user.name)}
        </div>
        <h2 className="font-display text-[18px] font-bold text-brand-primary">{user.name}</h2>
        <p className="mt-0.5 text-sm text-text-muted-2">{user.puesto || "Puesto sin registrar"}</p>

        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-divider pt-5 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label}>
              <div className="text-[10.5px] font-semibold uppercase tracking-wide text-text-muted-3">
                {f.label}
              </div>
              <div
                className={`text-sm font-semibold ${f.value ? "text-brand-primary" : "text-text-muted-3"}`}
              >
                {f.value || "Sin registrar"}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-divider pt-4">
          <BirthdayEditor initial={birthIso} />
        </div>
      </div>

      <p className="mt-4 max-w-[720px] text-xs text-text-muted-3">
        ¿Algún dato incorrecto? Repórtalo a Gente y Gestión para corregirlo en el siguiente Excel maestro.
      </p>

      <div className="mt-4 flex max-w-[720px] items-center gap-4 rounded-[14px] border border-border bg-surface p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-vacation-bg text-vacation-text">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
          </svg>
        </span>
        <div className="flex-1">
          <h3 className="font-display text-[15px] font-bold text-brand-primary">Modo oscuro</h3>
          <p className="text-xs text-text-muted-2">Más cómodo de noche. Se recuerda en este dispositivo.</p>
        </div>
        <ThemeSwitch />
      </div>

      <div className="mt-4">
        <PushToggle />
      </div>

      <p className="mt-3 max-w-[720px] text-xs text-text-muted-3">
        La contraseña solo la puede restablecer Gente y Gestión. Si necesitas una nueva, contáctalos.
      </p>

      <div className="mt-9 mb-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-[19px] font-bold text-brand-primary">Vacaciones y Permisos</h2>
        <NuevaSolicitudButton category={user.category} jefeName={user.manager?.name ?? null} />
      </div>

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-[14px] border border-border bg-surface p-5 shadow-sm">
            <div className="mb-3.5 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-text-muted-2">{k.label}</span>
              <span
                className={`font-display flex h-[34px] w-[34px] items-center justify-center rounded-[9px] text-base font-extrabold ${k.bg} ${k.col}`}
              >
                {k.icon}
              </span>
            </div>
            <div className="font-display text-[26px] font-extrabold leading-none text-brand-primary">
              {k.value}
            </div>
            <div className="mt-1.5 text-xs text-text-muted-3">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-[14px] border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-[16.5px] font-bold text-brand-primary">
              Historial de solicitudes
            </h3>
            <span className="text-xs text-text-muted-2">{requests.length} registros</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {requests.length === 0 && (
              <p className="py-6 text-center text-sm text-text-muted-3">Aún no tienes solicitudes.</p>
            )}
            {requests.map((r) => {
              const chip = formatDayChip(r.startDate);
              return (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center gap-3.5 rounded-[11px] border border-divider px-4 py-3"
                >
                  <span className="font-display flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[10px] bg-vacation-bg text-vacation-text">
                    <span className="text-base font-extrabold leading-none">{chip.day}</span>
                    <span className="text-[9px] font-semibold tracking-wide">{chip.month}</span>
                  </span>
                  <div className="min-w-[140px] flex-1">
                    <div className="text-[14.5px] font-bold text-brand-primary">
                      {LEAVE_TYPE_LABELS[r.type as LeaveType]}
                    </div>
                    <div className="text-xs text-text-muted-2">
                      {formatDateRange(r.startDate, r.endDate)} · {formatDays(r.days)}{" "}
                      {r.days === 1 ? "día" : "días"} · solicitado {formatDate(r.createdAt)}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                  {r.status === "APPROVED" && <PdfLink requestId={r.id} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-[14px] border border-border bg-surface p-5">
            <h3 className="font-display text-[16.5px] font-bold text-brand-primary">
              Mis días de vacaciones
            </h3>
            <p className="mb-4 mt-0.5 text-xs text-text-muted-3">
              Periodo {new Date().getUTCFullYear()}
            </p>
            <div className="mb-2 flex items-end gap-2">
              <span className="font-display text-[40px] font-extrabold leading-none text-brand-primary">
                {balance.available}
              </span>
              <span className="mb-1 text-sm text-text-muted-2">/ {balance.assigned} días</span>
            </div>
            <div className="mb-3.5 h-[9px] overflow-hidden rounded-full bg-divider">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#4A88FA,#6FA0FB)]"
                style={{ width: `${dispPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-text-muted-2">
              <span>
                Disponibles: <b className="text-brand-primary">{balance.available}</b>
              </span>
              <span>
                Programados: <b className="text-brand-primary">{balance.used}</b>
              </span>
            </div>
          </div>

          <div className="rounded-[14px] border border-border bg-surface p-5">
            <h3 className="mb-3.5 font-display text-[16.5px] font-bold text-brand-primary">
              Próximas ausencias
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-[13.5px] text-text-muted-3">
                Sin ausencias programadas próximamente.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        r.type === "VACATION"
                          ? "bg-brand-accent"
                          : r.type === "EARLY_FRIDAY"
                            ? "bg-brand-navy"
                            : "bg-teal"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-brand-primary">
                        {LEAVE_TYPE_LABELS[r.type as LeaveType]}
                      </div>
                      <div className="text-xs text-text-muted-2">
                        {formatDateRange(r.startDate, r.endDate)}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        r.status === "APPROVED"
                          ? "text-success"
                          : r.status === "PENDING"
                            ? "text-warning"
                            : "text-danger"
                      }`}
                    >
                      {r.status === "APPROVED" ? "Aprobada" : r.status === "PENDING" ? "Pendiente" : "Rechazada"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
