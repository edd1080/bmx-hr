import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseIsoDate, parseCategoria, parseEmpresa, cleanStr } from "@/lib/colaborador-fields";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Colaborador no encontrado." }, { status: 404 });

  const b = (await request.json()) as Record<string, unknown>;
  const name = cleanStr(b.name);
  if (!name) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });

  const email = cleanStr(b.email).toLowerCase();
  if (email && email !== user.email) {
    const dup = await prisma.user.findUnique({ where: { email } });
    if (dup && dup.id !== id) {
      return NextResponse.json({ error: `El correo ${email} ya está registrado.` }, { status: 400 });
    }
  }

  // Jefe inmediato: no puede ser uno mismo.
  let managerId: string | null = null;
  const mgr = cleanStr(b.managerId);
  if (mgr && mgr !== id) {
    const manager = await prisma.user.findUnique({ where: { id: mgr }, select: { id: true } });
    managerId = manager?.id ?? null;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      name,
      email: email || null,
      curp: cleanStr(b.curp).toUpperCase() || null,
      puesto: cleanStr(b.puesto) || null,
      area: cleanStr(b.area) || null,
      departamento: cleanStr(b.departamento) || null,
      telefono: cleanStr(b.telefono) || null,
      category: parseCategoria(b.category),
      vacationDaysAssigned: Number(b.vacationDaysAssigned) || 0,
      hireDate: parseIsoDate(b.hireDate),
      birthDate: parseIsoDate(b.birthDate),
      empresa: parseEmpresa(b.empresa),
      isHR: Boolean(b.isHR),
      managerId,
    },
  });

  return NextResponse.json({ ok: true, id: updated.id });
}
