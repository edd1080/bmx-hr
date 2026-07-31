import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NuevoColaboradorButton } from "@/components/nuevo-colaborador-button";
import { ColaboradoresTable } from "@/components/colaboradores-table";

export const dynamic = "force-dynamic";

export default async function ColaboradoresPage() {
  const session = await auth();
  if (!session!.user.isHR) redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      employeeCode: true,
      puesto: true,
      area: true,
      empresa: true,
      isHR: true,
      activo: true,
    },
  });

  const activos = users.filter((u) => u.activo).length;
  const bajas = users.length - activos;
  const managers = users.filter((u) => u.activo).map((u) => ({ id: u.id, name: u.name }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[23px] font-bold text-brand-primary">Colaboradores</h1>
          <p className="mt-0.5 text-sm text-text-muted-2">
            Altas, bajas y toda la información del personal · {activos} activos · {bajas} baja
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/importar"
            className="inline-flex items-center gap-2 rounded-[10px] border-[1.5px] border-border-input px-4 py-3 text-sm font-bold text-brand-primary hover:bg-page"
          >
            📊 Carga masiva (Excel)
          </Link>
          <NuevoColaboradorButton managers={managers} />
        </div>
      </div>

      <ColaboradoresTable rows={users} currentUserId={session!.user.id} />
    </div>
  );
}
