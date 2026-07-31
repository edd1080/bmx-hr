import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const nombre = String(body.nombre ?? "").trim();
  const puesto = String(body.puesto ?? "").trim();
  const descripcion = String(body.descripcion ?? "").trim();

  if (!nombre) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  if (!puesto) return NextResponse.json({ error: "El puesto es obligatorio." }, { status: 400 });

  const ruta = await prisma.ruta.create({
    data: { nombre, puesto, descripcion: descripcion || null },
  });
  return NextResponse.json({ ok: true, ruta });
}
