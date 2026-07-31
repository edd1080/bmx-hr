import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MODALIDAD_STYLES, MODALIDAD_LABELS, Modalidad } from "@/lib/courses";

export const dynamic = "force-dynamic";

export default async function UniversidadPage() {
  const courses = await prisma.course.findMany({
    orderBy: { titulo: "asc" },
    include: { _count: { select: { lessons: true } } },
  });

  // Agrupa por categoría ("escuela"). Sin categoría → "General".
  const escuelas = new Map<string, typeof courses>();
  for (const c of courses) {
    const key = c.categoria?.trim() || "General";
    if (!escuelas.has(key)) escuelas.set(key, []);
    escuelas.get(key)!.push(c);
  }
  const nombres = [...escuelas.keys()].sort();

  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#1C3565,#4A88FA)] p-8 text-white">
        <div className="text-3xl">🎓</div>
        <h1 className="font-display mt-2 text-2xl font-bold">Universidad Corporativa</h1>
        <p className="mt-1 max-w-xl text-[15px] text-[#DCE7FB]">
          Todo el conocimiento de Café Punta del Cielo, organizado por escuelas para tu desarrollo.
        </p>
        <Link
          href="/capacitacion"
          className="mt-4 inline-block rounded-[10px] bg-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/25"
        >
          Ver catálogo completo
        </Link>
      </div>

      {courses.length === 0 ? (
        <p className="rounded-[16px] border border-dashed border-border bg-surface p-10 text-center text-sm text-text-muted-2">
          Aún no hay cursos publicados.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {nombres.map((esc) => (
            <section key={esc}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="font-display text-[17px] font-bold text-brand-primary">{esc}</h2>
                <div className="h-px flex-1 bg-divider" />
                <span className="text-xs font-semibold text-text-muted-2">
                  {escuelas.get(esc)!.length} cursos
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {escuelas.get(esc)!.map((c) => {
                  const mod = c.modalidad as Modalidad;
                  const ms = MODALIDAD_STYLES[mod] ?? MODALIDAD_STYLES.VIRTUAL;
                  return (
                    <Link
                      key={c.id}
                      href={`/capacitacion/${c.id}`}
                      className="flex flex-col rounded-[14px] border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <span
                        className="mb-2 inline-block w-fit rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                        style={{ background: ms.bg, color: ms.text }}
                      >
                        {ms.icon} {MODALIDAD_LABELS[mod]}
                      </span>
                      <h3 className="font-display text-[15px] font-bold text-brand-primary">{c.titulo}</h3>
                      <p className="mt-1 line-clamp-2 flex-1 text-[13px] text-text-secondary">{c.descripcion}</p>
                      <span className="mt-2 text-xs font-semibold text-text-muted-2">
                        {c._count.lessons} {c._count.lessons === 1 ? "lección" : "lecciones"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
