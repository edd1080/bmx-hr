import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getInitials, getAvatarColors } from "@/lib/avatar";
import { TicketCommentForm } from "@/components/ticket-comment-form";
import { TicketEstadoControl } from "@/components/ticket-estado-control";
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

function formatWhen(d: Date): string {
  return d.toLocaleString("es-MX", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

export default async function TicketDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;
  const isHR = session!.user.isHR;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, puesto: true, area: true } },
      comentarios: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, isHR: true } } },
      },
    },
  });
  if (!ticket) notFound();
  if (ticket.userId !== userId && !isHR) redirect("/mesa-ayuda");

  const am = AREA_META[ticket.area as TicketArea];
  const em = ESTADO_META[ticket.estado as TicketEstado];
  const pm = PRIORIDAD_META[ticket.prioridad as TicketPrioridad];

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/mesa-ayuda"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted-2 hover:text-brand-primary"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Volver a Mesa de Ayuda
      </Link>

      <div className="rounded-[16px] border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-[11px] text-xl"
              style={{ background: am?.bg, color: am?.text }}
            >
              {am?.icon}
            </span>
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-text-muted-3">
                {ticketFolio(ticket.id)} <span className="font-semibold text-text-muted-2">· {am?.label}</span>
              </div>
              <h1 className="font-display text-xl font-bold text-brand-primary">{ticket.asunto}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: pm?.bg, color: pm?.text }}>
              {pm?.label}
            </span>
            <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: em?.bg, color: em?.text }}>
              {em?.label}
            </span>
          </div>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-[14.5px] leading-relaxed text-text-secondary">
          {ticket.descripcion}
        </p>
        <p className="mt-3 text-xs text-text-muted-2">
          Creado por <b className="text-brand-primary">{ticket.user.name}</b> · {formatWhen(ticket.createdAt)}
        </p>

        {isHR && (
          <div className="mt-5 border-t border-divider pt-4">
            <TicketEstadoControl ticketId={ticket.id} estado={ticket.estado} />
          </div>
        )}
      </div>

      {/* Seguimiento */}
      <div className="mt-6">
        <h2 className="font-display mb-3 text-[16px] font-bold text-brand-primary">
          Seguimiento ({ticket.comentarios.length})
        </h2>

        {ticket.comentarios.length === 0 ? (
          <p className="mb-4 rounded-[12px] border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-text-muted-3">
            Aún no hay comentarios. Escribe el primero abajo.
          </p>
        ) : (
          <div className="mb-4 flex flex-col gap-3">
            {ticket.comentarios.map((c) => {
              const av = getAvatarColors(c.user.id);
              return (
                <div key={c.id} className="flex gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold"
                    style={{ background: av.bg, color: av.col }}
                  >
                    {getInitials(c.user.name)}
                  </span>
                  <div className="flex-1 rounded-[12px] border border-divider bg-surface px-4 py-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-bold text-brand-primary">{c.user.name}</span>
                      {c.user.isHR && (
                        <span className="rounded-full bg-vacation-bg px-2 py-0.5 text-[10px] font-bold text-vacation-text">
                          Gente & Gestión
                        </span>
                      )}
                      <span className="text-[11px] text-text-muted-3">{formatWhen(c.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-[14px] text-text-secondary">{c.mensaje}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {ticket.estado === "CERRADO" ? (
          <p className="rounded-[12px] bg-page px-4 py-3 text-center text-sm font-semibold text-text-muted-2">
            Este ticket está cerrado.
          </p>
        ) : (
          <TicketCommentForm ticketId={ticket.id} />
        )}
      </div>
    </div>
  );
}
