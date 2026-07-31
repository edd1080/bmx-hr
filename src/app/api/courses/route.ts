import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  COURSE_TITULO_MAX,
  COURSE_DESC_MAX,
  COURSE_COVER_MAX_CHARS,
  isValidCoverData,
  isValidModalidad,
} from "@/lib/courses";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "Solo Gente y Gestión puede crear cursos." }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const titulo = String(body.titulo ?? "").trim();
  const descripcion = String(body.descripcion ?? "").trim();
  const categoria = String(body.categoria ?? "").trim();
  const coverData = body.coverData;
  const modalidad = isValidModalidad(body.modalidad) ? body.modalidad : "VIRTUAL";
  const sede = String(body.sede ?? "").trim();
  const instructor = String(body.instructor ?? "").trim();
  const horasNum = Number(body.horas);
  const horas = Number.isFinite(horasNum) && horasNum > 0 ? horasNum : null;
  const cupoNum = Number(body.cupo);
  const cupo = Number.isFinite(cupoNum) && cupoNum > 0 ? Math.floor(cupoNum) : null;
  const vigNum = Number(body.vigenciaMeses);
  const vigenciaMeses = Number.isFinite(vigNum) && vigNum > 0 ? Math.floor(vigNum) : null;
  const fechaEventoRaw = String(body.fechaEvento ?? "").trim();
  const fechaEvento = fechaEventoRaw ? new Date(fechaEventoRaw) : null;
  if (fechaEvento && Number.isNaN(fechaEvento.getTime())) {
    return NextResponse.json({ error: "Fecha del evento inválida." }, { status: 400 });
  }

  if (!titulo || titulo.length > COURSE_TITULO_MAX) {
    return NextResponse.json(
      { error: `El título es obligatorio (máx. ${COURSE_TITULO_MAX} caracteres).` },
      { status: 400 }
    );
  }
  if (!descripcion || descripcion.length > COURSE_DESC_MAX) {
    return NextResponse.json(
      { error: `La descripción es obligatoria (máx. ${COURSE_DESC_MAX} caracteres).` },
      { status: 400 }
    );
  }

  let cover: string | null = null;
  if (coverData != null && coverData !== "") {
    if (!isValidCoverData(coverData) || coverData.length > COURSE_COVER_MAX_CHARS) {
      return NextResponse.json(
        { error: "La portada no es válida o es demasiado grande." },
        { status: 400 }
      );
    }
    cover = coverData;
  }

  const course = await prisma.course.create({
    data: {
      authorId: session.user.id,
      titulo,
      descripcion,
      categoria: categoria || null,
      coverData: cover,
      modalidad,
      sede: modalidad === "PRESENCIAL" ? sede || null : null,
      instructor: instructor || null,
      horas,
      fechaEvento: modalidad === "PRESENCIAL" ? fechaEvento : null,
      cupo: modalidad === "PRESENCIAL" ? cupo : null,
      vigenciaMeses,
    },
  });

  return NextResponse.json({ ok: true, course });
}
