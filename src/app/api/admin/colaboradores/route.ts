import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateUsername, generateTempPassword } from "@/lib/import-columns";
import { parseIsoDate, parseCategoria, parseEmpresa, cleanStr } from "@/lib/colaborador-fields";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const b = (await request.json()) as Record<string, unknown>;
  const employeeCode = cleanStr(b.employeeCode);
  const name = cleanStr(b.name);
  const email = cleanStr(b.email).toLowerCase();

  if (!employeeCode) return NextResponse.json({ error: "El código de empleado es obligatorio." }, { status: 400 });
  if (!name) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });

  // Código único.
  const dupCode = await prisma.user.findUnique({ where: { employeeCode } });
  if (dupCode) return NextResponse.json({ error: `Ya existe un colaborador con el código ${employeeCode}.` }, { status: 400 });

  const username = generateUsername(employeeCode, email || null);
  const dupUser = await prisma.user.findUnique({ where: { username } });
  if (dupUser) return NextResponse.json({ error: `El usuario "${username}" ya existe.` }, { status: 400 });

  if (email) {
    const dupEmail = await prisma.user.findUnique({ where: { email } });
    if (dupEmail) return NextResponse.json({ error: `El correo ${email} ya está registrado.` }, { status: 400 });
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  let managerId: string | null = null;
  const mgr = cleanStr(b.managerId);
  if (mgr) {
    const manager = await prisma.user.findUnique({ where: { id: mgr }, select: { id: true } });
    managerId = manager?.id ?? null;
  }

  const user = await prisma.user.create({
    data: {
      employeeCode,
      name,
      email: email || null,
      username,
      passwordHash,
      mustChangePassword: true,
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

  return NextResponse.json({ ok: true, user: { id: user.id, username }, tempPassword });
}
