import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getNotifications, getUnreadCount } from "@/lib/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const [items, unreadCount] = await Promise.all([
    getNotifications(session.user.id),
    getUnreadCount(session.user.id),
  ]);

  return NextResponse.json({ items, unreadCount });
}
