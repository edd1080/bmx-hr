import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Valida el cuerpo (JSON payload) de una petición HTTP usando un esquema de Zod.
 * Si la validación falla, retorna una respuesta 400 Bad Request con detalles.
 */
export async function parseAndValidate<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  try {
    const json = await request.json();
    const result = schema.safeParse(json);

    if (!result.success) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: "Datos de entrada inválidos.",
            details: result.error.flatten().fieldErrors,
          },
          { status: 400 }
        ),
      };
    }

    return { ok: true, data: result.data };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "El cuerpo de la petición no contiene un JSON válido." },
        { status: 400 }
      ),
    };
  }
}
