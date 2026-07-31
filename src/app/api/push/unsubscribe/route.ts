import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { endpoint?: string };
  const endpoint = body.endpoint;
  if (!endpoint) {
    return NextResponse.json({ error: "Falta el endpoint." }, { status: 400 });
  }

  // Solo borra si la suscripción es de este usuario (deleteMany no falla si no existe).
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
