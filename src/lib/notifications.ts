import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

export async function notify(
  userId: string,
  message: string,
  relatedRequestId?: string,
  url?: string
) {
  await prisma.notification.create({
    data: { userId, message, relatedRequestId },
  });
  // Además de la notificación in-app, intenta un push al dispositivo (best-effort).
  await sendPushToUser(userId, {
    title: "Mis Gestiones",
    body: message,
    url: url || "/dashboard",
    tag: relatedRequestId,
  });
}

export async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
