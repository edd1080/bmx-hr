import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// Configura VAPID una sola vez. Si faltan las llaves (env no cargado), el módulo
// queda deshabilitado y los envíos son no-op: la app sigue funcionando sin push.
let configured = false;
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:soporte@cafepuntadelcielo.co";

if (publicKey && privateKey) {
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  } catch {
    configured = false;
  }
}

export function pushEnabled(): boolean {
  return configured;
}

export function getVapidPublicKey(): string | null {
  return publicKey ?? null;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

// Envía un push a TODOS los dispositivos suscritos de un usuario. Best-effort:
// nunca lanza (así no rompe el flujo que lo invoca) y limpia las suscripciones
// vencidas (404/410) para no reintentar contra endpoints muertos.
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!configured) return;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const body = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Suscripción expirada o cancelada: se elimina.
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
        // Otros errores (red, 5xx) se ignoran; el push es best-effort.
      }
    })
  );
}
