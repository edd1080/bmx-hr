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
} from "@/lib/metas";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const meta = await prisma.meta.findUnique({ where: { id } });
  if (!meta) {
    return NextResponse.json({ error: "Meta no encontrada." }, { status: 404 });
  }
  if (meta.userId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  if (meta.estado !== "BORRADOR") {
    return NextResponse.json({ error: "Solo se pueden editar metas en borrador." }, { status: 400 });
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

  const updated = await prisma.meta.update({
    where: { id },
    data: {
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
    },
  });

  return NextResponse.json({ ok: true, meta: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const meta = await prisma.meta.findUnique({ where: { id } });
  if (!meta) {
    return NextResponse.json({ error: "Meta no encontrada." }, { status: 404 });
  }
  if (meta.userId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  if (meta.estado !== "BORRADOR") {
    return NextResponse.json({ error: "Solo se pueden eliminar metas en borrador." }, { status: 400 });
  }

  await prisma.meta.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
