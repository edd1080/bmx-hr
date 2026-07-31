import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { birthDate } = (await request.json()) as { birthDate?: string };
  const raw = String(birthDate ?? "").trim();

  // Cadena vacía = limpiar la fecha.
  if (!raw) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { birthDate: null },
    });
    return NextResponse.json({ ok: true });
  }

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!iso) {
    return NextResponse.json({ error: "Fecha inválida (usa AAAA-MM-DD)." }, { status: 400 });
  }

  // Se guarda como medianoche UTC para que mes y día se lean sin corrimientos.
  const date = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Fecha inválida." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { birthDate: date },
  });

  return NextResponse.json({ ok: true });
}
