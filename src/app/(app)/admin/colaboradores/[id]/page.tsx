import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getInitials, getAvatarColors } from "@/lib/avatar";
import { getEmpresa } from "@/lib/empresas";
import { getVacationBalance } from "@/lib/leave-server";
import { LEAVE_TYPE_LABELS, formatDateRange, formatDays, LeaveType } from "@/lib/leave";
import { StatusBadge } from "@/components/status-badge";
import { ColaboradorForm } from "@/components/colaborador-form";
import { ColaboradorAcciones } from "@/components/colaborador-acciones";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "datos", label: "Datos" },
  { key: "vacaciones", label: "Vacaciones" },
  { key: "capacitacion", label: "Capacitación" },
  { key: "metas", label: "Metas" },
  { key: "bitacora", label: "Bitácora" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function toIso(d: Date | null): string {
  if (!d) return "";
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
function fmtDate(d: Date | null): string {
  return d ? d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "—";
}
function antiguedad(hire: Date | null): string {
  if (!hire) return "—";
  const years = (Date.now() - hire.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (years < 1) return `${Math.round(years * 12)} meses`;
  return `${Math.floor(years)} año${Math.floor(years) === 1 ? "" : "s"}`;
}

export default async function ColaboradorDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tab: TabKey = (TABS.find((t) => t.key === sp.tab)?.key ?? "datos") as TabKey;

  const session = await auth();
  if (!session!.user.isHR) redirect("/dashboard");

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  const avatar = getAvatarColors(user.id);
  const empresa = getEmpresa(user.empresa);
  const manager = user.managerId
    ? await prisma.user.findUnique({ where: { id: user.managerId }, select: { name: true } })
    : null;

  return (
    <div>
      <Link
        href="/admin/colaboradores"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted-2 hover:text-brand-primary"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
        Volver a Colaboradores
      </Link>

      {/* Encabezado */}
      <div className="flex flex-wrap items-center gap-4 rounded-[16px] border border-border bg-surface p-5">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-display text-[22px] font-bold" style={{ background: avatar.bg, color: avatar.col }}>
          {getInitials(user.name)}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-[21px] font-bold text-brand-primary">{user.name}</h1>
          <p className="text-sm text-text-muted">
            {[user.puesto, user.area, user.departamento].filter(Boolean).join(" · ") || "Puesto sin registrar"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {empresa && <span className="rounded-full bg-vacation-bg px-2.5 py-0.5 text-[10.5px] font-bold text-vacation-text">{empresa.clave}</span>}
            {user.isHR && <span className="rounded-full bg-vacation-bg px-2.5 py-0.5 text-[10.5px] font-bold text-vacation-text">G&amp;G</span>}
            {user.activo ? (
              <span className="rounded-full bg-success-bg px-2.5 py-0.5 text-[10.5px] font-bold text-success">Activo</span>
            ) : (
              <span className="rounded-full bg-danger-bg px-2.5 py-0.5 text-[10.5px] font-bold text-danger">
                Baja{user.bajaAt ? ` · ${user.bajaAt.toLocaleDateString("es-MX")}` : ""}
              </span>
            )}
          </div>
        </div>
        <div className="ml-auto text-right text-sm text-text-muted">
          Usuario<br />
          <b className="text-brand-primary">{user.username}</b>
        </div>
      </div>

      {/* Pestañas */}
      <div className="mt-4 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/colaboradores/${id}?tab=${t.key}`}
            className={`-mb-px border-b-2 px-3.5 py-2.5 text-[13px] font-bold ${
              tab === t.key ? "border-brand-accent text-brand-primary" : "border-transparent text-text-muted-2 hover:text-brand-primary"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-5">
        {tab === "datos" && <DatosTab user={user} sessionUserId={session!.user.id} />}
        {tab === "vacaciones" && <VacacionesTab userId={id} />}
        {tab === "capacitacion" && <CapacitacionTab userId={id} />}
        {tab === "metas" && <MetasTab userId={id} />}
        {tab === "bitacora" && (
          <BitacoraTab
            createdAt={user.createdAt}
            updatedAt={user.updatedAt}
            bajaAt={user.bajaAt}
            hireDate={user.hireDate}
            managerName={manager?.name ?? null}
          />
        )}
      </div>
    </div>
  );
}

// ---------- Datos ----------
async function DatosTab({
  user,
  sessionUserId,
}: {
  user: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;
  sessionUserId: string;
}) {
  const managers = (
    await prisma.user.findMany({
      where: { activo: true, NOT: { id: user.id } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    })
  ).map((m) => ({ id: m.id, name: m.name }));

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_300px]">
      <div className="rounded-[16px] border border-border bg-surface p-6">
        <ColaboradorForm
          mode="edit"
          managers={managers}
          initial={{
            id: user.id,
            employeeCode: user.employeeCode ?? "",
            name: user.name,
            email: user.email ?? "",
            curp: user.curp ?? "",
            puesto: user.puesto ?? "",
            area: user.area ?? "",
            departamento: user.departamento ?? "",
            telefono: user.telefono ?? "",
            category: user.category,
            vacationDaysAssigned: user.vacationDaysAssigned,
            hireDate: toIso(user.hireDate),
            birthDate: toIso(user.birthDate),
            empresa: user.empresa ?? "",
            isHR: user.isHR,
            managerId: user.managerId ?? "",
          }}
        />
      </div>
      <ColaboradorAcciones id={user.id} activo={user.activo} esUnoMismo={user.id === sessionUserId} />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] border border-border bg-surface p-6">
      <h3 className="font-display mb-4 text-[15px] font-bold text-brand-primary">{title}</h3>
      {children}
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-text-muted-3">{children}</p>;
}

// ---------- Vacaciones ----------
async function VacacionesTab({ userId }: { userId: string }) {
  const [balance, leaves] = await Promise.all([
    getVacationBalance(userId),
    prisma.leaveRequest.findMany({ where: { userId }, orderBy: { startDate: "desc" }, take: 30 }),
  ]);
  return (
    <Card title="Vacaciones y permisos">
      <div className="mb-5 grid grid-cols-3 gap-2">
        <div className="rounded-[10px] border border-border bg-page px-3 py-3 text-center">
          <div className="font-display text-2xl font-extrabold tabular-nums text-brand-primary">{balance.assigned}</div>
          <div className="text-[11px] text-text-muted">Asignados</div>
        </div>
        <div className="rounded-[10px] border border-border bg-page px-3 py-3 text-center">
          <div className="font-display text-2xl font-extrabold tabular-nums text-brand-primary">{balance.used}</div>
          <div className="text-[11px] text-text-muted">Tomados</div>
        </div>
        <div className="rounded-[10px] border border-border bg-page px-3 py-3 text-center">
          <div className="font-display text-2xl font-extrabold tabular-nums text-brand-primary">{balance.available}</div>
          <div className="text-[11px] text-text-muted">Disponibles</div>
        </div>
      </div>
      {leaves.length === 0 ? (
        <Empty>Sin solicitudes registradas.</Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {leaves.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-[10px] border border-divider px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-brand-primary">{LEAVE_TYPE_LABELS[r.type as LeaveType] ?? r.type}</div>
                <div className="text-[11.5px] text-text-muted-2">{formatDateRange(r.startDate, r.endDate)} · {formatDays(r.days)}</div>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------- Capacitación ----------
async function CapacitacionTab({ userId }: { userId: string }) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { course: { select: { titulo: true } } },
  });
  const done = enrollments.filter((e) => e.completedAt).length;
  return (
    <Card title="Capacitación">
      <p className="mb-4 text-sm text-text-muted">
        {enrollments.length === 0 ? "Sin cursos asignados." : `${done} de ${enrollments.length} cursos completados.`}
      </p>
      {enrollments.length > 0 && (
        <div className="flex flex-col gap-2">
          {enrollments.map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-[10px] border border-divider px-3 py-2.5">
              <div className="min-w-0 flex-1 truncate text-[13px] font-bold text-brand-primary">{e.course.titulo}</div>
              {e.completedAt ? (
                <span className="rounded-full bg-success-bg px-2.5 py-0.5 text-[10.5px] font-bold text-success">Completado</span>
              ) : (
                <span className="rounded-full bg-warning-bg px-2.5 py-0.5 text-[10.5px] font-bold text-warning">En curso</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------- Metas ----------
async function MetasTab({ userId }: { userId: string }) {
  const metas = await prisma.meta.findMany({ where: { userId }, orderBy: [{ ciclo: "desc" }] });
  const estadoStyle: Record<string, string> = {
    APROBADA: "bg-success-bg text-success",
    EN_REVISION: "bg-warning-bg text-warning",
    BORRADOR: "bg-page text-text-muted-2",
  };
  return (
    <Card title="Metas">
      {metas.length === 0 ? (
        <Empty>Sin metas capturadas.</Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {metas.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-[10px] border border-divider px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold text-brand-primary">{m.nombre}</div>
                <div className="text-[11.5px] text-text-muted-2">Ciclo {m.ciclo} · peso {m.peso}%</div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${estadoStyle[m.estado] ?? estadoStyle.BORRADOR}`}>
                {m.estado.replace("_", " ").toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------- Bitácora ----------
function BitacoraTab({
  createdAt,
  updatedAt,
  bajaAt,
  hireDate,
  managerName,
}: {
  createdAt: Date;
  updatedAt: Date;
  bajaAt: Date | null;
  hireDate: Date | null;
  managerName: string | null;
}) {
  const rows = [
    { label: "Fecha de ingreso", value: fmtDate(hireDate) },
    { label: "Alta en la plataforma", value: fmtDate(createdAt) },
    { label: "Última actualización", value: fmtDate(updatedAt) },
    { label: "Jefe directo", value: managerName ?? "Sin jefe asignado" },
    ...(bajaAt ? [{ label: "Fecha de baja", value: fmtDate(bajaAt) }] : []),
  ];
  return (
    <Card title="Bitácora">
      <div className="flex flex-col">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between border-b border-divider py-2.5 text-sm last:border-0">
            <span className="text-text-muted">{r.label}</span>
            <span className="font-semibold text-brand-primary">{r.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
