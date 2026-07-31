import { NextResponse } from "next/server";
import { getVapidPublicKey, pushEnabled } from "@/lib/push";

// Entrega la llave pública VAPID al cliente para poder suscribirse.
export async function GET() {
  return NextResponse.json({ publicKey: getVapidPublicKey(), enabled: pushEnabled() });
}
