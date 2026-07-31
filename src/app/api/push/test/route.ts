import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUser, pushEnabled } from "@/lib/push";

// Envía una notificación de prueba al propio usuario (para verificar el permiso
// y la suscripción del dispositivo desde Mi Perfil).
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (!pushEnabled()) {
    return NextResponse.json({ error: "El servidor no tiene configuradas las llaves de push." }, { status: 503 });
  }

  const count = await prisma.pushSubscription.count({ where: { userId: session.user.id } });
  if (count === 0) {
    return NextResponse.json({ error: "No tienes este dispositivo suscrito." }, { status: 400 });
  }

  await sendPushToUser(session.user.id, {
    title: "Notificación de prueba ✅",
    body: "¡Listo! Las notificaciones push están funcionando en este dispositivo.",
    url: "/dashboard",
    tag: "test",
  });

  return NextResponse.json({ ok: true, dispositivos: count });
}
