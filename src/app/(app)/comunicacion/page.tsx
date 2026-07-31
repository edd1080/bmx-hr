import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getInitials, getAvatarColors } from "@/lib/avatar";
import { POST_TIPO_LABELS, POST_TIPO_STYLES, PostTipo } from "@/lib/posts";
import { MONTH_NAMES, getMonthBirthdays, isBirthdayToday, BirthdayPerson } from "@/lib/birthdays";
import { DeletePostButton } from "@/components/delete-post-button";
import { ModuleRoadmap } from "@/components/module-roadmap";
import { ComunicacionAcciones } from "@/components/comunicacion/comunicacion-acciones";
import { EventoCard, type EventoCardData } from "@/components/comunicacion/evento-card";
import { EncuestaCard, type EncuestaCardData } from "@/components/comunicacion/encuesta-card";
import { ReconocimientoCard, type ReconocimientoCardData } from "@/components/comunicacion/reconocimiento-card";
import { RsvpEstado } from "@/lib/comunicacion";

export const dynamic = "force-dynamic";

function formatWhen(date: Date): string {
  return date.toLocaleString("es-MX", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

type FeedItem =
  | { kind: "post"; createdAt: Date; post: { id: string; tipo: string; titulo: string; cuerpo: string; imageData: string | null; createdAt: Date; author: { id: string; name: string } } }
  | { kind: "evento"; createdAt: Date; data: EventoCardData }
  | { kind: "encuesta"; createdAt: Date; data: EncuestaCardData }
  | { kind: "reconocimiento"; createdAt: Date; data: ReconocimientoCardData; canDelete: boolean };

export default async function ComunicacionPage() {
  const session = await auth();
  const userId = session!.user.id;
  const isHR = session!.user.isHR;

  const now = new Date();
  const month = now.getMonth() + 1;

  const [posts, eventos, encuestas, reconocimientos, misVotos, birthdays, me, colegas] = await Promise.all([
    prisma.post.findMany({ orderBy: { createdAt: "desc" }, include: { author: { select: { id: true, name: true } } } }),
    prisma.evento.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true } }, rsvps: { select: { userId: true, estado: true } } },
    }),
    prisma.encuesta.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true } },
        opciones: { orderBy: { orden: "asc" }, include: { _count: { select: { votos: true } } } },
      },
    }),
    prisma.reconocimiento.findMany({
      orderBy: { createdAt: "desc" },
      include: { de: { select: { id: true, name: true } }, para: { select: { id: true, name: true } } },
    }),
    prisma.encuestaVoto.findMany({ where: { userId }, select: { encuestaId: true, opcionId: true } }),
    getMonthBirthdays(month),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, birthDate: true } }),
    prisma.user.findMany({ where: { activo: true, id: { not: userId } }, select: { id: true, name: true, area: true }, orderBy: { name: "asc" } }),
  ]);

  const myVoteByEncuesta = new Map(misVotos.map((v) => [v.encuestaId, v.opcionId]));

  // ---- Construir el feed unificado ----
  const feed: FeedItem[] = [];

  for (const p of posts) feed.push({ kind: "post", createdAt: p.createdAt, post: p });

  for (const e of eventos) {
    const counts: Record<RsvpEstado, number> = { SI: 0, TALVEZ: 0, NO: 0 };
    let myEstado: RsvpEstado | null = null;
    for (const r of e.rsvps) {
      if (r.estado === "SI" || r.estado === "TALVEZ" || r.estado === "NO") counts[r.estado]++;
      if (r.userId === userId) myEstado = r.estado as RsvpEstado;
    }
    feed.push({
      kind: "evento",
      createdAt: e.createdAt,
      data: {
        id: e.id,
        titulo: e.titulo,
        descripcion: e.descripcion,
        imageData: e.imageData,
        lugar: e.lugar,
        inicio: e.inicio.toISOString(),
        fin: e.fin ? e.fin.toISOString() : null,
        authorId: e.author.id,
        authorName: e.author.name,
        counts,
        myEstado,
      },
    });
  }

  for (const q of encuestas) {
    const opciones = q.opciones.map((o) => ({ id: o.id, texto: o.texto, votos: o._count.votos }));
    const totalVotos = opciones.reduce((s, o) => s + o.votos, 0);
    feed.push({
      kind: "encuesta",
      createdAt: q.createdAt,
      data: {
        id: q.id,
        pregunta: q.pregunta,
        cerrada: q.cerrada,
        authorId: q.author.id,
        authorName: q.author.name,
        totalVotos,
        myOpcionId: myVoteByEncuesta.get(q.id) ?? null,
        opciones,
      },
    });
  }

  for (const r of reconocimientos) {
    feed.push({
      kind: "reconocimiento",
      createdAt: r.createdAt,
      data: { id: r.id, deId: r.de.id, deName: r.de.name, paraId: r.para.id, paraName: r.para.name, categoria: r.categoria, mensaje: r.mensaje },
      canDelete: r.de.id === userId || isHR,
    });
  }

  feed.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const proximosEventos = eventos
    .filter((e) => (e.fin ?? e.inicio).getTime() >= now.getTime())
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())
    .slice(0, 4);

  const myBirthdayToday = !!me?.birthDate && isBirthdayToday(me.birthDate, now);
  const firstName = (me?.name ?? "").split(" ")[0];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[23px] font-bold text-brand-primary">Comunicación</h1>
          <p className="mt-0.5 text-sm text-text-muted-2">
            Comunicados, eventos, encuestas, reconocimientos y cumpleaños
          </p>
        </div>
        <ComunicacionAcciones isHR={isHR} colegas={colegas} />
      </div>

      {myBirthdayToday && (
        <div className="mb-6 overflow-hidden rounded-[18px] bg-[linear-gradient(120deg,#1C3565_0%,#4A88FA_100%)] p-6 text-white">
          <div className="text-3xl">🎉🎂🥳</div>
          <h2 className="font-display mt-2 text-2xl font-bold">¡Feliz cumpleaños, {firstName}!</h2>
          <p className="mt-1 text-[15px] text-[#DCE7FB]">
            Todo el equipo te desea un día increíble. Gracias por ser parte de la familia bia.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.7fr_1fr]">
        {/* Feed */}
        <div className="flex flex-col gap-5">
          {feed.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-border bg-surface p-10 text-center">
              <div className="text-3xl">📢</div>
              <p className="mt-2 text-sm font-semibold text-brand-primary">Aún no hay publicaciones</p>
              <p className="mt-1 text-sm text-text-muted-2">
                Comparte un reconocimiento con «⭐ Reconocer»
                {isHR ? ", o publica un comunicado, evento o encuesta." : "."}
              </p>
            </div>
          ) : (
            feed.map((item) => {
              if (item.kind === "post") {
                const p = item.post;
                const style = POST_TIPO_STYLES[p.tipo as PostTipo] ?? POST_TIPO_STYLES.COMUNICADO;
                const avatar = getAvatarColors(p.author.id);
                return (
                  <article key={`post-${p.id}`} className="overflow-hidden rounded-[16px] border border-border bg-surface shadow-sm">
                    <div className="flex items-center gap-3 px-5 py-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold" style={{ background: avatar.bg, color: avatar.col }}>
                        {getInitials(p.author.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-brand-primary">{p.author.name}</div>
                        <div className="text-xs text-text-muted-2">{formatWhen(p.createdAt)}</div>
                      </div>
                      <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: style.bg, color: style.text }}>
                        {style.icon} {POST_TIPO_LABELS[p.tipo as PostTipo] ?? "Comunicado"}
                      </span>
                      {isHR && <DeletePostButton postId={p.id} />}
                    </div>
                    {p.imageData && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageData} alt={p.titulo} className="max-h-[520px] w-full object-cover" />
                    )}
                    <div className="px-5 py-4">
                      <h3 className="font-display text-[17px] font-bold text-brand-primary">{p.titulo}</h3>
                      <p className="mt-2 whitespace-pre-wrap text-[14.5px] leading-relaxed text-text-secondary">{p.cuerpo}</p>
                    </div>
                  </article>
                );
              }
              if (item.kind === "evento") return <EventoCard key={`ev-${item.data.id}`} evento={item.data} isHR={isHR} />;
              if (item.kind === "encuesta") return <EncuestaCard key={`en-${item.data.id}`} encuesta={item.data} isHR={isHR} />;
              return <ReconocimientoCard key={`re-${item.data.id}`} rec={item.data} canDelete={item.canDelete} />;
            })
          )}
        </div>

        {/* Panel derecho */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          {proximosEventos.length > 0 && (
            <aside className="rounded-[16px] border border-border bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tint-purple-bg text-lg">📅</span>
                <h2 className="font-display text-[16px] font-bold text-brand-primary">Próximos eventos</h2>
              </div>
              <ul className="flex flex-col gap-2.5">
                {proximosEventos.map((e) => {
                  const d = e.inicio;
                  return (
                    <li key={e.id} className="flex items-center gap-3 rounded-[11px] border border-divider px-3 py-2.5">
                      <span className="font-display flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-[10px] bg-page text-brand-primary">
                        <span className="text-base font-extrabold leading-none">{d.getDate()}</span>
                        <span className="text-[8px] font-semibold uppercase">{MONTH_NAMES[d.getMonth()].slice(0, 3)}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-brand-primary">{e.titulo}</div>
                        <div className="truncate text-xs text-text-muted-2">
                          {d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                          {e.lugar ? ` · ${e.lugar}` : ""}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </aside>
          )}

          <BirthdayPanel month={month} today={now.getDate()} birthdays={birthdays} />
        </div>
      </div>

      <div className="mt-6">
        <ModuleRoadmap
          title="Comunicación Interna — funciones del módulo"
          intro="Este es el canal principal de comunicación con los colaboradores."
          items={[
            { label: "Noticias", done: true },
            { label: "Comunicados", done: true },
            { label: "Cumpleaños del mes", done: true },
            { label: "Eventos con confirmación de asistencia", done: true },
            { label: "Encuestas", done: true },
            { label: "Reconocimientos entre colaboradores", done: true },
            { label: "Notificaciones dentro de la app y push al celular", done: true },
          ]}
        />
      </div>
    </div>
  );
}

function BirthdayPanel({ month, today, birthdays }: { month: number; today: number; birthdays: BirthdayPerson[] }) {
  return (
    <aside className="rounded-[16px] border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tint-pink-bg text-lg">🎂</span>
        <div>
          <h2 className="font-display text-[16px] font-bold text-brand-primary">Cumpleaños</h2>
          <p className="text-xs text-text-muted-2">{MONTH_NAMES[month - 1]}</p>
        </div>
      </div>

      {birthdays.length === 0 ? (
        <p className="py-4 text-center text-sm text-text-muted-3">Nadie cumple años este mes registrado.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {birthdays.map((b) => {
            const isToday = b.day === today;
            return (
              <li key={b.id} className={`flex items-center gap-3 rounded-[11px] border px-3 py-2.5 ${isToday ? "border-brand-accent bg-vacation-bg" : "border-divider"}`}>
                <span className={`font-display flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-[10px] ${isToday ? "bg-brand-accent text-white" : "bg-page text-brand-primary"}`}>
                  <span className="text-base font-extrabold leading-none">{b.day}</span>
                  <span className="text-[8px] font-semibold uppercase">{MONTH_NAMES[month - 1].slice(0, 3)}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-brand-primary">{b.name} {isToday && "🎉"}</div>
                  <div className="truncate text-xs text-text-muted-2">{b.puesto || b.area || "Café Punta del Cielo"}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
