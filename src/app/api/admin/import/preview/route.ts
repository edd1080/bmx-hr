import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseWorkbook, buildPlan, type ExistingUser } from "@/lib/import-sync";

const USER_SELECT = {
  id: true,
  employeeCode: true,
  name: true,
  email: true,
  curp: true,
  area: true,
  departamento: true,
  puesto: true,
  telefono: true,
  category: true,
  vacationDaysAssigned: true,
  hireDate: true,
  birthDate: true,
  empresa: true,
  isHR: true,
  managerId: true,
  activo: true,
} as const;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Sube un archivo Excel o CSV." }, { status: 400 });
  }

  let parsed;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    parsed = parseWorkbook(buffer);
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer el archivo. Verifica que sea un Excel o CSV válido." },
      { status: 400 },
    );
  }

  const existing = (await prisma.user.findMany({ select: USER_SELECT })) as ExistingUser[];
  const plan = buildPlan(parsed, existing);

  return NextResponse.json({ plan });
}
