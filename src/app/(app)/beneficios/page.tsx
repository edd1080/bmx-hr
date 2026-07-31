import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ModuleRoadmap } from "@/components/module-roadmap";
import { NuevoBeneficioButton } from "@/components/nuevo-beneficio-button";
import { DeleteBeneficioButton } from "@/components/delete-beneficio-button";
import { BENEFICIO_TIPOS, BENEFICIO_TIPO_META } from "@/lib/beneficios";

export const dynamic = "force-dynamic";

export default async function BeneficiosPage() {
  const session = await auth();
  const isHR = session!.user.isHR;

  const beneficios = await prisma.beneficio.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[23px] font-bold text-brand-primary">Beneficios</h1>
          <p className="mt-0.5 text-sm text-text-muted-2">
            Beneficios, convenios y programas de bienestar para colaboradores
          </p>
        </div>
        {isHR && <NuevoBeneficioButton />}
      </div>

      {beneficios.length === 0 ? (
        <div className="mb-6 flex flex-col items-center justify-center rounded-[16px] border border-dashed border-border bg-surface px-8 py-14 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-tint-pink-bg text-3xl">🎁</span>
          <p className="mt-3 text-sm font-semibold text-brand-primary">Aún no hay beneficios publicados</p>
          <p className="mt-1 max-w-md text-sm text-text-muted-2">
            {isHR
              ? "Publica el primero con «Nuevo beneficio»."
              : "Gente y Gestión publicará aquí los beneficios, convenios y descuentos."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {BENEFICIO_TIPOS.filter((t) => beneficios.some((b) => b.tipo === t)).map((tipo) => {
            const m = BENEFICIO_TIPO_META[tipo];
            const items = beneficios.filter((b) => b.tipo === tipo);
            return (
              <section key={tipo}>
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg text-base" style={{ background: m.bg, color: m.text }}>
                    {m.icon}
                  </span>
                  <h2 className="font-display text-[17px] font-bold text-brand-primary">{m.plural}</h2>
                  <div className="h-px flex-1 bg-divider" />
                  <span className="text-xs font-semibold text-text-muted-2">{items.length}</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((b) => (
                    <div key={b.id} className="flex flex-col overflow-hidden rounded-[14px] border border-border bg-surface shadow-sm">
                      {b.imageData && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.imageData} alt={b.titulo} className="h-36 w-full object-cover" />
                      )}
                      <div className="flex flex-1 flex-col p-4">
                        <div className="mb-1.5 flex items-start justify-between gap-2">
                          <h3 className="font-display text-[15px] font-bold text-brand-primary">{b.titulo}</h3>
                          {isHR && <DeleteBeneficioButton beneficioId={b.id} />}
                        </div>
                        <p className="flex-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-text-secondary">
                          {b.descripcion}
                        </p>
                        {b.vigencia && (
                          <p className="mt-2 text-xs font-semibold text-text-muted-2">Vigencia: {b.vigencia}</p>
                        )}
                        {b.enlace && (
                          <a
                            href={b.enlace}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-[9px] px-3.5 py-2 text-sm font-bold text-white"
                            style={{ background: m.text }}
                          >
                            Más información
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M7 17L17 7M9 7h8v8" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <ModuleRoadmap
          title="Beneficios — funciones del módulo"
          items={[
            { label: "Beneficios vigentes", done: true },
            { label: "Convenios con empresas", done: true },
            { label: "Programas internos", done: true },
            { label: "Descuentos", done: true },
            { label: "Campañas de bienestar", done: true },
          ]}
        />
      </div>
    </div>
  );
}
