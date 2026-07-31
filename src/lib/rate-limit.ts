import { NextResponse } from "next/server";

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

const store = new Map<string, RateLimitRecord>();

// Limpiar entradas expiradas periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(key);
    }
  }
}, 60000);

/**
 * Aplica una restricción de tasa (Rate Limit) basada en IP / identificador.
 * @param identifier Identificador único de la petición (ej. IP del cliente o ID de usuario).
 * @param limit Número máximo de solicitudes permitidas en la ventana de tiempo.
 * @param windowMs Tamaño de la ventana de tiempo en milisegundos (por defecto 1 minuto = 60,000ms).
 */
export function checkRateLimit(
  identifier: string,
  limit = 10,
  windowMs = 60000
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const record = store.get(identifier);

  if (!record || now > record.resetTime) {
    store.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, reset: Math.ceil((now + windowMs) / 1000) };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, reset: Math.ceil(record.resetTime / 1000) };
  }

  record.count++;
  return { success: true, remaining: limit - record.count, reset: Math.ceil(record.resetTime / 1000) };
}

/**
 * Middleware auxiliar para retornar una respuesta HTTP 429 Too Many Requests cuando se excede el límite.
 */
export function rateLimitResponse(resetHeader: number): NextResponse {
  return NextResponse.json(
    {
      error: "Demasiadas peticiones. Has excedido el límite permitido. Por favor reintenta en un momento.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(resetHeader),
        "X-RateLimit-Reset": String(resetHeader),
      },
    }
  );
}
