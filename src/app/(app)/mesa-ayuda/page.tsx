import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NuevoTicketButton } from "@/components/nuevo-ticket-button";
import { ModuleRoadmap } from "@/components/module-roadmap";
import {
  AREA_META,
  ESTADO_META,
  PRIORIDAD_META,
  TicketArea,
  TicketEstado,
  TicketPrioridad,
  ticketFolio,
} from "@/lib/tickets";

export const dynamic = "force-dynamic";

export default async function MesaAyudaPage() {
  const session = await auth();
  const userId = session!.user.id;
  const isHR = session!.user.isHR;

  const tickets = await prisma.ticket.findMany({
    where: isHR ? {} : { userId },
    orderBy: [{ createdAt: "desc" }],
    include: {
      user: { select: { name: true } },
      _count: { select: { comentarios: true } },
    },
  });

  const abiertos = tickets.filter((t) => t.estado === "ABIERTO" || t.estado === "EN_PROCESO").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[23px] font-bold text-brand-primary">Mesa de Ayuda</h1>
          <p className="mt-0.5 text-sm text-text-muted-2">
            {isHR
              ? "Tickets de todos los colaboradores · seguimiento hasta el cierre"
              : "Levanta solicitudes a las áreas y da seguimiento"}
          </p>
        </div>
        <NuevoTicketButton />
      </div>

      {isHR && (
        <div className="mb-5 inline-flex items-center gap-2 rounded-[11px] bg-surface border border-border px-4 py-2.5 text-sm">
          <span className="font-bold text-brand-primary">{abiertos}</span>
          <span className="text-text-muted-2">tickets por atender</span>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-border bg-surface p-10 text-center">
          <div className="text-3xl">🎫</div>
          <p className="mt-2 text-sm font-semibold text-brand-primary">
            {isHR ? "No hay tickets todavía" : "No has levantado tickets"}
          </p>
          <p className="mt-1 text-sm text-text-muted-2">Usa «Nuevo ticket» para crear una solicitud.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((t) => {
            const am = AREA_META[t.area as TicketArea];
            const em = ESTADO_META[t.estado as TicketEstado];
            const pm = PRIORIDAD_META[t.prioridad as TicketPrioridad];
            return (
              <Link
                key={t.id}
                href={`/mesa-ayuda/${t.id}`}
                className="flex flex-wrap items-center gap-3 rounded-[14px] border border-border bg-surface px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-lg"
                  style={{ background: am?.bg, color: am?.text }}
                >
                  {am?.icon}
                </span>
                <div className="min-w-[180px] flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-text-muted-3">{ticketFolio(t.id)}</span>
                    <span className="text-[11px] font-semibold text-text-muted-2">· {am?.label}</span>
                  </div>
                  <div className="text-[14.5px] font-bold text-brand-primary">{t.asunto}</div>
                  <div className="mt-0.5 text-xs text-text-muted-2">
                    {isHR ? `${t.user.name} · ` : ""}
                    {t.createdAt.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                    {t._count.comentarios > 0 ? ` · ${t._count.comentarios} comentarios` : ""}
                  </div>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ background: pm?.bg, color: pm?.text }}
                >
                  {pm?.label}
                </span>
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-bold"
                  style={{ background: em?.bg, color: em?.text }}
                >
                  {em?.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <ModuleRoadmap
          title="Mesa de Ayuda — funciones del módulo"
          items={[
            { label: "Tickets a Recursos Humanos", done: true },
            { label: "Tickets a Capacitación", done: true },
            { label: "Tickets a Sistemas", done: true },
            { label: "Tickets a Mantenimiento", done: true },
            { label: "Tickets a Compras", done: true },
            { label: "Tickets a Administración", done: true },
            { label: "Seguimiento y estatus de cada ticket", done: true },
            { label: "Cierre y notificación al colaborador", done: true },
          ]}
        />
      </div>
    </div>
  );
}
