import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  BENEFICIO_TITULO_MAX,
  BENEFICIO_DESC_MAX,
  BENEFICIO_IMAGE_MAX_CHARS,
  isValidBeneficioTipo,
  isValidBeneficioImage,
  isHttpUrl,
} from "@/lib/beneficios";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "Solo Gente y Gestión puede publicar beneficios." }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const tipo = body.tipo;
  const titulo = String(body.titulo ?? "").trim();
  const descripcion = String(body.descripcion ?? "").trim();
  const vigencia = String(body.vigencia ?? "").trim();
  const enlace = String(body.enlace ?? "").trim();
  const imageData = body.imageData;

  if (!isValidBeneficioTipo(tipo)) {
    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  }
  if (!titulo || titulo.length > BENEFICIO_TITULO_MAX) {
    return NextResponse.json(
      { error: `El título es obligatorio (máx. ${BENEFICIO_TITULO_MAX} caracteres).` },
      { status: 400 }
    );
  }
  if (!descripcion || descripcion.length > BENEFICIO_DESC_MAX) {
    return NextResponse.json({ error: "La descripción es obligatoria." }, { status: 400 });
  }
  if (enlace && !isHttpUrl(enlace)) {
    return NextResponse.json({ error: "El enlace debe ser una URL válida (http o https)." }, { status: 400 });
  }

  let image: string | null = null;
  if (imageData != null && imageData !== "") {
    if (!isValidBeneficioImage(imageData) || imageData.length > BENEFICIO_IMAGE_MAX_CHARS) {
      return NextResponse.json({ error: "La imagen no es válida o es demasiado grande." }, { status: 400 });
    }
    image = imageData;
  }

  const beneficio = await prisma.beneficio.create({
    data: {
      authorId: session.user.id,
      tipo,
      titulo,
      descripcion,
      vigencia: vigencia || null,
      enlace: enlace || null,
      imageData: image,
    },
  });

  return NextResponse.json({ ok: true, beneficio });
}
