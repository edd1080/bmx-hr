import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isManager as checkIsManager } from "@/lib/leave-server";
import { getInitials, getAvatarColors } from "@/lib/avatar";
import { getMonthBirthdays, isBirthdayToday, isBirthdayThisMonth } from "@/lib/birthdays";
import { POST_TIPO_LABELS, POST_TIPO_STYLES, PostTipo } from "@/lib/posts";

export const dynamic = "force-dynamic";

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "hace un momento";
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;
  const isHR = session.user.isHR ?? false;
  const isManager = await checkIsManager(userId);
  const firstName = (session.user.name ?? "Colaborador").split(" ")[0];

  const now = new Date();
  const month = now.getMonth() + 1;

  const [me, posts, birthdays, metaTotal, metaAprobadas, enrollTotal, enrollDone] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { birthDate: true } }),
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { author: { select: { id: true, name: true } } },
    }),
    getMonthBirthdays(month),
    prisma.meta.count({ where: { userId } }),
    prisma.meta.count({ where: { userId, estado: "APROBADA" } }),
    prisma.enrollment.count({ where: { userId } }),
    prisma.enrollment.count({ where: { userId, completedAt: { not: null } } }),
  ]);

  const birthdayToday = !!me?.birthDate && isBirthdayToday(me.birthDate, now);
  const birthdayMonth = !!me?.birthDate && isBirthdayThisMonth(me.birthDate, now);
  const enrollPct = enrollTotal > 0 ? Math.round((enrollDone / enrollTotal) * 100) : 0;
  const metaPct = metaTotal > 0 ? Math.round((metaAprobadas / metaTotal) * 100) : 0;

  const showRail = isManager || isHR;

  return (
    <div className={`grid items-start gap-6 ${showRail ? "lg:grid-cols-[1fr_320px]" : ""}`}>
      {/* ---------- CENTRO ---------- */}
      <div className="min-w-0">
        {birthdayToday ? (
          <div className="mb-5 overflow-hidden rounded-[16px] bg-[linear-gradient(120deg,#1C3565_0%,#4A88FA_100%)] p-6 text-white">
            <div className="text-3xl">🎉🎂🥳</div>
            <h2 className="font-display mt-2 text-2xl font-bold">¡Feliz cumpleaños, {firstName}!</h2>
            <p className="mt-1 text-[15px] text-[#DCE7FB]">
              Todo el equipo te desea un día increíble. 🎊
            </p>
          </div>
        ) : (
          <div className="mb-5">
            <h1 className="font-display text-[22px] font-bold text-brand-primary">Hola, {firstName}</h1>
            <p className="text-sm text-text-muted">Esto es lo que sucede en tu operación el día de hoy.</p>
            {birthdayMonth && (
              <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-vacation-bg px-3 py-1 text-[12.5px] font-semibold text-vacation-text">
                🎂 Este mes es tu cumpleaños — ¡felicidades por adelantado!
              </span>
            )}
          </div>
        )}

        {/* Tarjetas resumen: Metas + Capacitación */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/metas" className="rounded-[12px] border border-border bg-surface p-4 transition hover:border-[#cdd7e8]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-vacation-bg text-vacation-text">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.2" /></svg>
              </span>
              <h3 className="font-display text-[14px] font-bold text-brand-primary">Mis metas</h3>
            </div>
            <p className="mt-2 text-xs text-text-muted">
              {metaTotal === 0 ? "Sin metas capturadas" : `${metaAprobadas} de ${metaTotal} aprobadas`}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-divider">
              <div className="h-full rounded-full bg-brand-accent" style={{ width: `${metaPct}%` }} />
            </div>
          </Link>

          <Link href="/capacitacion" className="rounded-[12px] border border-border bg-surface p-4 transition hover:border-[#cdd7e8]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-halfday-bg text-halfday-text">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 4 2 9l10 5 10-5-10-5Z" /><path d="M6 11.5V16c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-4.5" /></svg>
              </span>
              <h3 className="font-display text-[14px] font-bold text-brand-primary">Capacitación</h3>
            </div>
            <p className="mt-2 text-xs text-text-muted">
              {enrollTotal === 0 ? "Sin cursos asignados" : `${enrollDone} de ${enrollTotal} completados`}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-divider">
              <div className="h-full rounded-full bg-brand-accent" style={{ width: `${enrollPct}%` }} />
            </div>
          </Link>
        </div>

        {/* Feed de Comunicación */}
        <div className="mb-3 mt-7 flex items-center gap-3">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.09em] text-text-muted-2">Comunicación</span>
          <span className="h-px flex-1 bg-border" />
          <Link href="/comunicacion" className="text-[12px] font-bold text-brand-accent hover:underline">Ver todo</Link>
        </div>

        {isHR && (
          <Link
            href="/comunicacion"
            className="mb-4 flex items-center gap-3 rounded-[14px] border border-dashed border-border bg-surface px-5 py-3.5 text-sm text-text-muted-2 hover:border-brand-accent"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-vacation-bg text-brand-accent">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
            </span>
            Publicar un comunicado para toda la empresa…
          </Link>
        )}

        <div className="flex flex-col gap-4">
          {posts.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-border bg-surface p-10 text-center">
              <p className="text-sm font-semibold text-brand-primary">Aún no hay publicaciones</p>
              <p className="mt-1 text-sm text-text-muted-2">Los comunicados de Gente y Gestión aparecerán aquí.</p>
            </div>
          ) : (
            posts.map((p) => {
              const style = POST_TIPO_STYLES[p.tipo as PostTipo] ?? POST_TIPO_STYLES.COMUNICADO;
              const avatar = getAvatarColors(p.author.id);
              return (
                <article key={p.id} className="overflow-hidden rounded-[14px] border border-border bg-surface">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[13px] font-bold" style={{ background: avatar.bg, color: avatar.col }}>
                      {getInitials(p.author.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-bold text-brand-primary">{p.author.name}</div>
                      <div className="text-[11px] text-text-muted-2">{timeAgo(p.createdAt)}</div>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-[10.5px] font-bold" style={{ background: style.bg, color: style.text }}>
                      {POST_TIPO_LABELS[p.tipo as PostTipo] ?? "Comunicado"}
                    </span>
                  </div>
                  {p.imageData && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageData} alt={p.titulo} className="max-h-[440px] w-full object-cover" />
                  )}
                  <div className="px-4 py-3.5">
                    <h3 className="font-display text-[15.5px] font-bold text-brand-primary">{p.titulo}</h3>
                    <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-[13.5px] leading-relaxed text-text-secondary">{p.cuerpo}</p>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* ---------- PANEL DERECHO ---------- */}
      {showRail && (
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          {isManager && <TeamPanel userId={userId} />}
          {isHR && <OpsPanel birthdaysCount={birthdays.length} />}
        </aside>
      )}
    </div>
  );
}

function RailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-border bg-surface p-4">
      <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-muted-2">{title}</h3>
      {children}
    </div>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="rounded-[10px] border border-border bg-page px-3 py-2.5">
      <div className="font-display text-xl font-extrabold tabular-nums text-brand-primary">{n}</div>
      <div className="mt-0.5 text-[10.5px] text-text-muted">{l}</div>
    </div>
  );
}

function PendingRow({ name, detail, href }: { name: string; detail: string; href: string }) {
  const av = getAvatarColors(name);
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-[10px] border border-border px-2.5 py-2 hover:border-[#cdd7e8]">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: av.bg, color: av.col }}>
        {getInitials(name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-bold text-brand-primary">{name}</div>
        <div className="truncate text-[10.5px] text-text-muted-2">{detail}</div>
      </div>
      <span className="rounded-full bg-warning-bg px-2 py-0.5 text-[10px] font-bold text-warning">Revisar</span>
    </Link>
  );
}

async function TeamPanel({ userId }: { userId: string }) {
  const [pendingApprovals, pendingMetaReviews, teamSize, pendingList] = await Promise.all([
    prisma.leaveRequest.count({ where: { managerId: userId, status: "PENDING" } }),
    prisma.meta.count({ where: { managerId: userId, estado: "EN_REVISION" } }),
    prisma.user.count({ where: { managerId: userId, activo: true } }),
    prisma.leaveRequest.findMany({
      where: { managerId: userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { user: { select: { name: true } } },
    }),
  ]);

  return (
    <RailCard title="Mi equipo">
      <div className="grid grid-cols-2 gap-2">
        <Stat n={pendingApprovals} l="Aprobaciones pendientes" />
        <Stat n={pendingMetaReviews} l="Metas por revisar" />
        <Stat n={teamSize} l="En mi equipo" />
      </div>
      {pendingList.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          {pendingList.map((r) => (
            <PendingRow key={r.id} name={r.user.name} detail="Vacaciones / permiso" href="/equipo" />
          ))}
        </div>
      )}
    </RailCard>
  );
}

async function OpsPanel({ birthdaysCount }: { birthdaysCount: number }) {
  const [activos, porRegistrar, pendingList] = await Promise.all([
    prisma.user.count({ where: { activo: true } }),
    prisma.leaveRequest.count({ where: { status: "APPROVED", pdfGeneratedAt: null } }),
    prisma.leaveRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { user: { select: { name: true } } },
    }),
  ]);

  return (
    <>
      <RailCard title="Operación de hoy">
        <div className="grid grid-cols-2 gap-2">
          <Stat n={activos} l="Colaboradores activos" />
          <Stat n={pendingList.length} l="Solicitudes pendientes" />
          <Stat n={birthdaysCount} l="Cumpleaños del mes" />
          <Stat n={porRegistrar} l="Constancias por generar" />
        </div>
      </RailCard>
      {pendingList.length > 0 && (
        <RailCard title="Solicitudes por aprobar">
          <div className="flex flex-col gap-1.5">
            {pendingList.map((r) => (
              <PendingRow key={r.id} name={r.user.name} detail="Vacaciones / permiso" href="/admin/solicitudes" />
            ))}
          </div>
        </RailCard>
      )}
      <RailCard title="Accesos rápidos">
        <div className="flex flex-col gap-2">
          <Link href="/admin/colaboradores" className="flex items-center justify-center gap-2 rounded-[10px] bg-brand-navy px-3 py-2.5 text-[12.5px] font-bold text-white hover:brightness-110">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
            Nueva alta de personal
          </Link>
          <Link href="/admin/importar" className="flex items-center justify-center gap-2 rounded-[10px] border border-border bg-page px-3 py-2.5 text-[12.5px] font-bold text-brand-primary hover:border-[#cdd7e8]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 15V3m0 12-4-4m4 4 4-4" transform="rotate(180 12 9)" /><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></svg>
            Importar Excel
          </Link>
        </div>
      </RailCard>
    </>
  );
}
