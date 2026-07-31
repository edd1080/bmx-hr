import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FirmarDocumento } from "@/components/firma/firmar-documento";
import { DocumentoAcciones } from "@/components/firma/documento-acciones";
import { getComplianceForDoc } from "@/lib/firma-server";
import { DOCUMENTO_TIPO_META, ALCANCE_META, documentoFolio, type DocumentoTipo } from "@/lib/firma";

export const dynamic = "force-dynamic";

function fmtFechaHora(d: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function Adjunto({ data, nombre }: { data: string; nombre: string | null }) {
  const esPdf = data.startsWith("data:application/pdf");
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-secondary">
        <span>📎</span>
        <span className="truncate">{nombre || "Archivo adjunto"}</span>
        <a href={data} download={nombre || "documento"} className="ml-auto text-xs font-bold text-brand-accent">
          Descargar
        </a>
      </div>
      {esPdf ? (
        <iframe src={data} title={nombre || "Documento"} className="h-[520px] w-full rounded-[10px] border border-border" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data} alt={nombre || "Adjunto"} className="w-full rounded-[10px] border border-border" />
      )}
    </div>
  );
}

export default async function DocumentoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;
  const isHR = session!.user.isHR;

  const doc = await prisma.documento.findUnique({
    where: { id },
    include: { author: { select: { name: true } }, destinatarios: { select: { userId: true } } },
  });
  if (!doc) notFound();

  const m = DOCUMENTO_TIPO_META[doc.tipo as DocumentoTipo] ?? DOCUMENTO_TIPO_META.DOCUMENTO;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/firma" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted-2 hover:text-brand-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
        Firma Electrónica
      </Link>

      {/* Documento */}
      <div className="rounded-[16px] border border-border bg-surface p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: m.bg, color: m.text }}>
            {m.icon} {m.label}
          </span>
          <span className="text-[11px] font-semibold text-text-muted-3">{documentoFolio(doc.id)}</span>
          {doc.cerrado && (
            <span className="rounded-full bg-page px-2.5 py-0.5 text-[11px] font-bold text-text-muted-2">Cerrado</span>
          )}
        </div>

        <h1 className="font-display text-[22px] font-bold leading-tight text-brand-primary">{doc.titulo}</h1>
        <p className="mt-1.5 text-xs text-text-muted-2">
          Publicado por {doc.author.name} · {fmtFechaHora(doc.createdAt)} ·{" "}
          {ALCANCE_META[doc.alcance as keyof typeof ALCANCE_META]?.label}
          {doc.alcance === "AREA" && doc.area ? ` (${doc.area})` : ""}
        </p>
        {doc.vigencia && <p className="mt-1 text-xs font-semibold text-brand-primary">Vigencia: {doc.vigencia}</p>}

        <div className="mt-4 whitespace-pre-wrap text-[14px] leading-relaxed text-text-secondary">{doc.cuerpo}</div>

        {doc.archivoData && <Adjunto data={doc.archivoData} nombre={doc.archivoNombre} />}
      </div>

      {isHR ? (
        <TableroCumplimiento docId={doc.id} cerrado={doc.cerrado} />
      ) : (
        <ZonaFirma
          docId={doc.id}
          userId={userId}
          cerrado={doc.cerrado}
          alcance={doc.alcance}
          area={doc.area}
          destinatarios={doc.destinatarios.map((d) => d.userId)}
          nombreSugerido={session!.user.name ?? ""}
        />
      )}
    </div>
  );
}

async function TableroCumplimiento({ docId, cerrado }: { docId: string; cerrado: boolean }) {
  const data = await getComplianceForDoc(docId);
  if (!data) return null;
  const { audienceTotal, firmadas, pendientes, doc } = data;
  const pct = audienceTotal > 0 ? Math.round((firmadas / audienceTotal) * 100) : 0;

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-[17px] font-bold text-brand-primary">Tablero de cumplimiento</h2>
        <DocumentoAcciones documentoId={docId} cerrado={cerrado} redirectOnDelete="/firma" />
      </div>

      <div className="mb-5 rounded-[14px] border border-border bg-surface p-4">
        <div className="mb-1.5 flex items-center justify-between text-sm font-semibold">
          <span className="text-text-secondary">{firmadas} de {audienceTotal} firmaron</span>
          <span className={firmadas >= audienceTotal && audienceTotal > 0 ? "text-success" : "text-text-muted-2"}>{pct}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-page">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--brand-accent)" }} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Firmaron */}
        <section>
          <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-success">Firmaron ({firmadas})</h3>
          {doc.firmas.length === 0 ? (
            <p className="rounded-[11px] border border-dashed border-border bg-surface px-3 py-4 text-sm text-text-muted-2">Nadie ha firmado todavía.</p>
          ) : (
            <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
              {doc.firmas.map((f) => (
                <div key={f.id} className="border-b border-divider px-3.5 py-2.5 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-bg text-[11px] font-bold text-success">
                      {getInitials(f.user.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-brand-primary">{f.user.name}</span>
                      <span className="block truncate text-[11px] text-text-muted-2">
                        {f.user.puesto || f.user.area || "—"}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-[11px] text-text-muted-2">{fmtFechaHora(f.createdAt)}</span>
                  </div>
                  <div className="mt-1 pl-[42px] text-[11px] text-text-muted-3">
                    Firma: «{f.nombreFirma}» · hash {f.hashDoc.slice(0, 10)}…
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pendientes */}
        <section>
          <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-text-muted-2">Faltan ({pendientes.length})</h3>
          {pendientes.length === 0 ? (
            <p className="rounded-[11px] border border-dashed border-border bg-surface px-3 py-4 text-sm text-success">¡Todos firmaron! 🎉</p>
          ) : (
            <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
              {pendientes.map((u) => (
                <div key={u.id} className="flex items-center gap-2.5 border-b border-divider px-3.5 py-2.5 last:border-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-page text-[11px] font-bold text-text-muted-2">
                    {getInitials(u.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-brand-primary">{u.name}</span>
                    <span className="block truncate text-[11px] text-text-muted-2">{u.puesto || u.area || "—"}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

async function ZonaFirma({
  docId,
  userId,
  cerrado,
  alcance,
  area,
  destinatarios,
  nombreSugerido,
}: {
  docId: string;
  userId: string;
  cerrado: boolean;
  alcance: string;
  area: string | null;
  destinatarios: string[];
  nombreSugerido: string;
}) {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { area: true } });
  const enAudiencia =
    alcance === "TODOS"
      ? true
      : alcance === "AREA"
        ? !!area && !!me?.area && area === me.area
        : destinatarios.includes(userId);

  const miFirma = await prisma.firma.findUnique({
    where: { documentoId_userId: { documentoId: docId, userId } },
    select: { nombreFirma: true, createdAt: true },
  });

  if (miFirma) {
    return (
      <div className="mt-6 rounded-[14px] border-[1.5px] border-success bg-success-bg p-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">✔</span>
          <h3 className="font-display text-[15px] font-bold text-brand-primary">Ya firmaste este documento</h3>
        </div>
        <p className="mt-1.5 text-[13px] text-text-secondary">
          Firmado como «{miFirma.nombreFirma}» el {fmtFechaHora(miFirma.createdAt)}.
        </p>
      </div>
    );
  }

  if (!enAudiencia) {
    return (
      <div className="mt-6 rounded-[14px] border border-border bg-surface p-5 text-sm text-text-muted-2">
        Este documento no está dirigido a ti.
      </div>
    );
  }

  if (cerrado) {
    return (
      <div className="mt-6 rounded-[14px] border border-border bg-surface p-5 text-sm text-text-muted-2">
        Este documento está cerrado y ya no admite firmas. Contacta a Gente y Gestión si necesitas firmarlo.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <FirmarDocumento documentoId={docId} nombreSugerido={nombreSugerido} />
    </div>
  );
}
