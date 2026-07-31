import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ModuleRoadmap } from "@/components/module-roadmap";
import { NuevoDocumentoButton } from "@/components/firma/nuevo-documento-button";
import { getPendingDocsForUser, getSignedDocsForUser } from "@/lib/firma-server";
import { DOCUMENTO_TIPO_META, ALCANCE_META, documentoFolio, type DocumentoTipo } from "@/lib/firma";

export const dynamic = "force-dynamic";

function fmtFecha(d: Date) {
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

function TipoChip({ tipo }: { tipo: string }) {
  const m = DOCUMENTO_TIPO_META[tipo as DocumentoTipo] ?? DOCUMENTO_TIPO_META.DOCUMENTO;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{ background: m.bg, color: m.text }}
    >
      {m.icon} {m.label}
    </span>
  );
}

export default async function FirmaPage() {
  const session = await auth();
  const userId = session!.user.id;
  const isHR = session!.user.isHR;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[23px] font-bold text-brand-primary">Firma Electrónica</h1>
          <p className="mt-0.5 text-sm text-text-muted-2">
            Documentos internos con acuse auditable: quién firmó y cuándo
          </p>
        </div>
        {isHR && <FirmaHeaderAction />}
      </div>

      {isHR ? <VistaHR /> : <VistaColaborador userId={userId} />}

      <div className="mt-8">
        <ModuleRoadmap
          title="Firma Electrónica — funciones del módulo"
          items={[
            { label: "Firma de políticas", done: true },
            { label: "Firma de comunicados", done: true },
            { label: "Acuses de recibido", done: true },
            { label: "Firma de documentos internos", done: true },
            { label: "Registro de quién firmó y cuándo", done: true },
            { label: "Tablero de cumplimiento (quién falta)", done: true },
          ]}
        />
      </div>
    </div>
  );
}

// El botón necesita las áreas y colaboradores activos; se resuelve aparte para
// no bloquear el render del encabezado.
async function FirmaHeaderAction() {
  const [grupos, colaboradores] = await Promise.all([
    prisma.user.groupBy({ by: ["area"], where: { activo: true } }),
    prisma.user.findMany({
      where: { activo: true },
      select: { id: true, name: true, area: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const areas = grupos
    .map((g) => g.area)
    .filter((a): a is string => !!a)
    .sort((a, b) => a.localeCompare(b, "es"));
  return <NuevoDocumentoButton areas={areas} colaboradores={colaboradores} />;
}

async function VistaHR() {
  const [docs, activeTotal, grupos] = await Promise.all([
    prisma.documento.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tipo: true,
        titulo: true,
        alcance: true,
        area: true,
        vigencia: true,
        cerrado: true,
        createdAt: true,
        _count: { select: { firmas: true, destinatarios: true } },
      },
    }),
    prisma.user.count({ where: { activo: true } }),
    prisma.user.groupBy({ by: ["area"], where: { activo: true }, _count: { _all: true } }),
  ]);

  const areaCount = new Map(grupos.map((g) => [g.area ?? "", g._count._all]));

  function audienceTotal(d: (typeof docs)[number]) {
    if (d.alcance === "TODOS") return activeTotal;
    if (d.alcance === "AREA") return areaCount.get(d.area ?? "") ?? 0;
    return d._count.destinatarios;
  }

  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[16px] border border-dashed border-border bg-surface px-8 py-14 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-earlyfriday-bg text-3xl">✍️</span>
        <p className="mt-3 text-sm font-semibold text-brand-primary">Aún no hay documentos publicados</p>
        <p className="mt-1 max-w-md text-sm text-text-muted-2">
          Publica el primero con «Nuevo documento». Los colaboradores lo verán y firmarán de recibido.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {docs.map((d) => {
        const total = audienceTotal(d);
        const pct = total > 0 ? Math.round((d._count.firmas / total) * 100) : 0;
        const completo = total > 0 && d._count.firmas >= total;
        return (
          <Link
            key={d.id}
            href={`/firma/${d.id}`}
            className="flex flex-col rounded-[14px] border border-border bg-surface p-4 shadow-sm transition-colors hover:border-brand-accent"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <TipoChip tipo={d.tipo} />
              <span className="text-[11px] font-semibold text-text-muted-3">{documentoFolio(d.id)}</span>
            </div>
            <h3 className="font-display text-[15px] font-bold leading-snug text-brand-primary">{d.titulo}</h3>
            <p className="mt-1 text-xs text-text-muted-2">
              {ALCANCE_META[d.alcance as keyof typeof ALCANCE_META]?.label}
              {d.alcance === "AREA" && d.area ? ` · ${d.area}` : ""} · {fmtFecha(d.createdAt)}
              {d.cerrado && " · Cerrado"}
            </p>

            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[12px] font-semibold">
                <span className="text-text-secondary">
                  {d._count.firmas} de {total} firmaron
                </span>
                <span className={completo ? "text-success" : "text-text-muted-2"}>{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-page">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: completo ? "var(--success)" : "var(--brand-accent)" }}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

async function VistaColaborador({ userId }: { userId: string }) {
  const [pendientes, firmados] = await Promise.all([
    getPendingDocsForUser(userId),
    getSignedDocsForUser(userId),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="mb-3 flex items-center gap-2.5">
          <h2 className="font-display text-[17px] font-bold text-brand-primary">Pendientes de firma</h2>
          <div className="h-px flex-1 bg-divider" />
          <span className="text-xs font-semibold text-text-muted-2">{pendientes.length}</span>
        </div>

        {pendientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[16px] border border-dashed border-border bg-surface px-8 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-2xl">✅</span>
            <p className="mt-3 text-sm font-semibold text-brand-primary">No tienes documentos pendientes</p>
            <p className="mt-1 text-sm text-text-muted-2">Cuando Gente y Gestión publique algo por firmar, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {pendientes.map((d) => {
              const m = DOCUMENTO_TIPO_META[d.tipo as DocumentoTipo] ?? DOCUMENTO_TIPO_META.DOCUMENTO;
              return (
                <Link
                  key={d.id}
                  href={`/firma/${d.id}`}
                  className="flex items-center gap-3 rounded-[13px] border-[1.5px] border-brand-accent/40 bg-surface p-4 shadow-sm transition-colors hover:border-brand-accent"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: m.bg, color: m.text }}>
                    {m.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[14px] font-bold text-brand-primary">{d.titulo}</span>
                    <span className="block text-xs text-text-muted-2">
                      {m.label} · {fmtFecha(d.createdAt)}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-vacation-bg px-2.5 py-1 text-[11px] font-bold text-brand-accent">
                    Firmar
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {firmados.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2.5">
            <h2 className="font-display text-[17px] font-bold text-brand-primary">Firmados</h2>
            <div className="h-px flex-1 bg-divider" />
            <span className="text-xs font-semibold text-text-muted-2">{firmados.length}</span>
          </div>
          <div className="overflow-hidden rounded-[13px] border border-border bg-surface">
            {firmados.map((f) => {
              const m = DOCUMENTO_TIPO_META[f.documento.tipo as DocumentoTipo] ?? DOCUMENTO_TIPO_META.DOCUMENTO;
              return (
                <Link
                  key={f.id}
                  href={`/firma/${f.documento.id}`}
                  className="flex items-center gap-3 border-b border-divider px-4 py-3 last:border-0 hover:bg-page"
                >
                  <span className="text-lg" aria-hidden>{m.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-brand-primary">{f.documento.titulo}</span>
                    <span className="block text-xs text-text-muted-2">{m.label}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[11px] font-semibold text-success">✔ Firmado</span>
                    <span className="block text-[11px] text-text-muted-2">{fmtFecha(f.createdAt)}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
