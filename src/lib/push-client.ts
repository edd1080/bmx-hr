// Helpers de Web Push del lado del navegador (PWA "Mis Gestiones").

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/sw.js");
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js");
}

export type PushState = {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
};

export async function getPushState(): Promise<PushState> {
  if (!isPushSupported()) return { supported: false, permission: "unsupported", subscribed: false };
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  return { supported: true, permission: Notification.permission, subscribed: !!sub };
}

// Pide permiso, se suscribe con la llave VAPID y guarda la suscripción en el server.
// Devuelve un motivo de error legible o null si todo salió bien.
export async function enablePush(): Promise<string | null> {
  if (!isPushSupported()) return "Este navegador no soporta notificaciones push.";

  const res = await fetch("/api/push/vapid");
  const { publicKey, enabled } = (await res.json()) as { publicKey: string | null; enabled: boolean };
  if (!enabled || !publicKey) return "El servidor no tiene configuradas las notificaciones push.";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "No diste permiso para notificaciones.";

  const reg = await registerServiceWorker();
  await navigator.serviceWorker.ready;

  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    }));

  const saved = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
  if (!saved.ok) return "No se pudo guardar la suscripción en el servidor.";
  return null;
}

export async function disablePush(): Promise<string | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  if (sub) {
    const endpoint = sub.endpoint;
    await sub.unsubscribe().catch(() => {});
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    }).catch(() => {});
  }
  return null;
}
