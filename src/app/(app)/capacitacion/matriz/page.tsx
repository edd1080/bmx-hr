import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeVigencia, VIGENCIA_META } from "@/lib/courses";

export const dynamic = "force-dynamic";

export default async function MatrizPage() {
  const session = await auth();
  if (!session!.user.isHR) redirect("/capacitacion");

  const now = new Date();
  const [users, courses, enrollments] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, puesto: true, area: true },
    }),
    prisma.course.findMany({
      orderBy: { titulo: "asc" },
      select: { id: true, titulo: true, vigenciaMeses: true },
    }),
    prisma.enrollment.findMany({
      select: { userId: true, courseId: true, estado: true, completedAt: true },
    }),
  ]);

  // Índice (userId::courseId) -> inscripción.
  const idx = new Map<string, (typeof enrollments)[number]>();
  for (const e of enrollments) idx.set(`${e.userId}::${e.courseId}`, e);
  const vigById = new Map(courses.map((c) => [c.id, c.vigenciaMeses]));

  function cell(userId: string, courseId: string) {
    const e = idx.get(`${userId}::${courseId}`);
    if (!e) return { label: "—", bg: "transparent", text: "#9AA5BB", title: "No inscrito" };
    if (e.estado !== "COMPLETADO")
      return { label: "◐", bg: "#FBF0DD", text: "#B4740E", title: "En curso" };
    const { estado, venceEl } = computeVigencia(e.completedAt, vigById.get(courseId) ?? null, now);
    const meta = VIGENCIA_META[estado];
    const venceTxt = venceEl ? ` (vence ${venceEl.toLocaleDateString("es-MX")})` : "";
    return { label: "✓", bg: meta.bg, text: meta.text, title: `${meta.label}${venceTxt}` };
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[23px] font-bold text-brand-primary">Matriz de capacitación</h1>
          <p className="mt-0.5 text-sm text-text-muted-2">
            Estado de cada colaborador por curso, con vigencia de constancias
          </p>
        </div>
        <Link href="/capacitacion" className="text-sm font-semibold text-text-muted-2 hover:text-brand-primary">
          ← Capacitación
        </Link>
      </div>

      {/* Leyenda */}
      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
        <Chip bg={VIGENCIA_META.VIGENTE.bg} text={VIGENCIA_META.VIGENTE.text} label="✓ Vigente" />
        <Chip bg={VIGENCIA_META.POR_VENCER.bg} text={VIGENCIA_META.POR_VENCER.text} label="✓ Por vencer" />
        <Chip bg={VIGENCIA_META.VENCIDO.bg} text={VIGENCIA_META.VENCIDO.text} label="✓ Vencido" />
        <Chip bg="#FBF0DD" text="#B4740E" label="◐ En curso" />
        <Chip bg="#EEF1F6" text="#6B7690" label="— No inscrito" />
      </div>

      {courses.length === 0 ? (
        <p className="rounded-[16px] border border-dashed border-border bg-surface p-10 text-center text-sm text-text-muted-2">
          Aún no hay cursos para mostrar en la matriz.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-border bg-surface">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-[200px] bg-surface px-4 py-3 text-left text-[12px] font-bold text-brand-primary">
                  Colaborador
                </th>
                {courses.map((c) => (
                  <th
                    key={c.id}
                    className="min-w-[44px] border-l border-divider px-2 py-3 text-center align-bottom"
                  >
                    <span className="mx-auto block max-w-[120px] text-[11px] font-semibold leading-tight text-text-secondary">
                      {c.titulo}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-divider">
                  <td className="sticky left-0 z-10 bg-surface px-4 py-2.5">
                    <div className="text-[13px] font-bold text-brand-primary">{u.name}</div>
                    <div className="text-[11px] text-text-muted-2">{u.puesto || u.area || "—"}</div>
                  </td>
                  {courses.map((c) => {
                    const cl = cell(u.id, c.id);
                    return (
                      <td key={c.id} className="border-l border-divider px-2 py-2.5 text-center" title={cl.title}>
                        <span
                          className="mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold"
                          style={{ background: cl.bg, color: cl.text }}
                        >
                          {cl.label}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Chip({ bg, text, label }: { bg: string; text: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold" style={{ background: bg, color: text }}>
      {label}
    </span>
  );
}
