import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  META_TIPOS,
  META_CATEGORIAS,
  META_NATURALEZAS,
  META_DESCRIPCION_MAX_LENGTH,
  isValidPeso,
  normalizeAlcanceParcial,
  getCurrentCiclo,
  getCicloDateRange,
} from "@/lib/metas";
import { hasApprovedMetaForCiclo } from "@/lib/metas-server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cicloParam = Number(searchParams.get("ciclo"));
  const ciclo = Number.isFinite(cicloParam) && cicloParam > 0 ? cicloParam : getCurrentCiclo();

  const metas = await prisma.meta.findMany({
    where: { userId: session.user.id, ciclo },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ metas });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const {
    tipo,
    categoria,
    nombre,
    descripcion,
    peso,
    naturaleza,
    memoriaCalculo,
    valorAnterior,
    valor,
    unidad,
    alcanceParcial,
    fuente,
  } = body as Record<string, unknown>;

  if (!(META_TIPOS as readonly string[]).includes(String(tipo))) {
    return NextResponse.json({ error: "Tipo de meta inválido." }, { status: 400 });
  }
  if (!(META_CATEGORIAS as readonly string[]).includes(String(categoria))) {
    return NextResponse.json({ error: "Categoría inválida." }, { status: 400 });
  }
  if (!(META_NATURALEZAS as readonly string[]).includes(String(naturaleza))) {
    return NextResponse.json({ error: "Naturaleza inválida." }, { status: 400 });
  }
  if (typeof peso !== "number" || !isValidPeso(peso)) {
    return NextResponse.json({ error: "Peso inválido." }, { status: 400 });
  }

  const nombreStr = String(nombre ?? "").trim();
  const descripcionStr = String(descripcion ?? "").trim();
  const memoriaStr = String(memoriaCalculo ?? "").trim();
  const valorStr = String(valor ?? "").trim();
  const unidadStr = String(unidad ?? "").trim();
  const fuenteStr = String(fuente ?? "").trim();

  if (!nombreStr) {
    return NextResponse.json({ error: "Falta el nombre de la meta." }, { status: 400 });
  }
  if (!descripcionStr || descripcionStr.length > META_DESCRIPCION_MAX_LENGTH) {
    return NextResponse.json(
      { error: `La descripción debe tener entre 1 y ${META_DESCRIPCION_MAX_LENGTH} caracteres.` },
      { status: 400 }
    );
  }
  if (!memoriaStr || !valorStr || !unidadStr || !fuenteStr) {
    return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
  }

  const ciclo = getCurrentCiclo();
  if (await hasApprovedMetaForCiclo(session.user.id, ciclo)) {
    return NextResponse.json(
      { error: "Ya tienes metas aprobadas y bloqueadas para este ciclo — no se pueden agregar más." },
      { status: 400 }
    );
  }

  const requester = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const { start, end } = getCicloDateRange(ciclo);

  const meta = await prisma.meta.create({
    data: {
      userId: requester.id,
      ciclo,
      tipo: tipo as string,
      categoria: categoria as string,
      nombre: nombreStr,
      descripcion: descripcionStr,
      peso,
      naturaleza: naturaleza as string,
      memoriaCalculo: memoriaStr,
      valorAnterior: valorAnterior ? String(valorAnterior).trim() || null : null,
      valor: valorStr,
      unidad: unidadStr,
      alcanceParcial: normalizeAlcanceParcial(tipo as string, Boolean(alcanceParcial)),
      fuente: fuenteStr,
      fechaInicio: start,
      fechaFin: end,
      managerId: requester.managerId,
    },
  });

  return NextResponse.json({ ok: true, meta });
}
