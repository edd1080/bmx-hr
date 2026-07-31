import { NextResponse } from "next/server";
import { requireHR } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { uploadBufferToStorage } from "@/lib/storage";
import {
  POST_TITULO_MAX,
  POST_CUERPO_MAX,
  isValidPostTipo,
  isValidImageData,
} from "@/lib/posts";

export async function POST(request: Request) {
  const hrAuth = await requireHR();
  if (!hrAuth.ok) return hrAuth.response;

  const currentUser = hrAuth.context.user;
  const body = (await request.json()) as Record<string, unknown>;
  const tipo = body.tipo;
  const titulo = String(body.titulo ?? "").trim();
  const cuerpo = String(body.cuerpo ?? "").trim();
  const imageData = body.imageData;

  if (!isValidPostTipo(tipo)) {
    return NextResponse.json({ error: "Tipo de publicación inválido." }, { status: 400 });
  }
  if (!titulo || titulo.length > POST_TITULO_MAX) {
    return NextResponse.json(
      { error: `El título es obligatorio (máx. ${POST_TITULO_MAX} caracteres).` },
      { status: 400 }
    );
  }
  if (!cuerpo || cuerpo.length > POST_CUERPO_MAX) {
    return NextResponse.json(
      { error: `El contenido es obligatorio (máx. ${POST_CUERPO_MAX} caracteres).` },
      { status: 400 }
    );
  }

  let imageUrl: string | null = null;

  if (imageData != null && typeof imageData === "string" && imageData !== "") {
    if (imageData.startsWith("http://") || imageData.startsWith("https://")) {
      imageUrl = imageData;
    } else if (isValidImageData(imageData)) {
      try {
        // Convierte Base64 data URL a Buffer y sube a Supabase Storage
        const matches = imageData.match(/^data:(.+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const buffer = Buffer.from(matches[2], "base64");
          const fileName = `posts/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;

          imageUrl = await uploadBufferToStorage(buffer, fileName, contentType);
        } else {
          imageUrl = imageData; // Fallback
        }
      } catch {
        imageUrl = imageData; // Fallback si Storage no esta listo en .env
      }
    }
  }

  const post = await prisma.post.create({
    data: {
      authorId: currentUser.id,
      tipo,
      titulo,
      cuerpo,
      imageData: imageUrl,
    },
  });

  return NextResponse.json({ ok: true, post });
}
