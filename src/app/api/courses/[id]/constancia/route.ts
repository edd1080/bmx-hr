import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEmpresa } from "@/lib/empresas";

const NAVY = rgb(0.11, 0.21, 0.4);
const GRAY = rgb(0.4, 0.4, 0.4);

function formatLongDateEs(date: Date): string {
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

// Folio corto y estable derivado del id de inscripción.
function folioFrom(id: string): string {
  return `CAP-${id.slice(-8).toUpperCase()}`;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return new Response("No autenticado.", { status: 401 });
  }

  const { id: courseId } = await params;
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo") === "dc3" ? "dc3" : "diploma";
  const requestedUserId = searchParams.get("userId");

  // Por defecto la constancia es del propio usuario; G&G puede generar la de cualquiera.
  const targetUserId = requestedUserId && session.user.isHR ? requestedUserId : session.user.id;

  const [course, user, enrollment] = await Promise.all([
    prisma.course.findUnique({ where: { id: courseId } }),
    prisma.user.findUnique({ where: { id: targetUserId } }),
    prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId, userId: targetUserId } },
    }),
  ]);

  if (!course || !user) return new Response("No encontrado.", { status: 404 });
  if (!enrollment || enrollment.estado !== "COMPLETADO") {
    return new Response("La constancia solo está disponible para cursos completados.", { status: 400 });
  }

  const bestAttempt = await prisma.examAttempt.findFirst({
    where: { courseId, userId: targetUserId, aprobado: true },
    orderBy: { score: "desc" },
  });

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const logoBytes = await readFile(path.join(process.cwd(), "public", "logo-azul.png"));
  const logoImage = await pdfDoc.embedPng(logoBytes);

  const fechaCompletado = enrollment.completedAt ?? new Date();
  const folio = folioFrom(enrollment.id);

  if (tipo === "dc3") {
    // La empresa (persona moral) sale del propio colaborador; G&G puede forzar otra con ?empresa=.
    const empresaParam = searchParams.get("empresa");
    const empresa = getEmpresa(empresaParam && session.user.isHR ? empresaParam : user.empresa);
    drawDC3(pdfDoc.addPage([612, 792]), font, bold, { course, user, fechaCompletado, folio, empresa });
  } else {
    drawDiploma(pdfDoc.addPage([792, 612]), font, bold, logoImage, {
      course,
      user,
      fechaCompletado,
      folio,
      score: bestAttempt?.score ?? null,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const nombreArchivo = `${tipo === "dc3" ? "DC3" : "constancia"}_${user.name.replace(/\s+/g, "_")}.pdf`;
  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nombreArchivo}"`,
    },
  });
}

type Ctx = {
  course: { titulo: string; horas: number | null; modalidad: string; categoria: string | null; instructor: string | null; sede: string | null; fechaEvento: Date | null };
  user: { name: string; curp: string | null; puesto: string | null; employeeCode: string | null };
  fechaCompletado: Date;
  folio: string;
  score?: number | null;
  empresa?: { rfc: string; razonSocial: string } | null;
};

// Diploma / constancia interna con diseño horizontal.
function drawDiploma(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  logo: Awaited<ReturnType<PDFDocument["embedPng"]>>,
  ctx: Ctx
) {
  const W = 792;
  const center = (text: string, y: number, size: number, f: PDFFont, color = NAVY) => {
    const w = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (W - w) / 2, y, size, font: f, color });
  };

  page.drawRectangle({ x: 24, y: 24, width: W - 48, height: 612 - 48, borderColor: NAVY, borderWidth: 2 });
  page.drawRectangle({ x: 32, y: 32, width: W - 64, height: 612 - 64, borderColor: rgb(0.8, 0.85, 0.92), borderWidth: 1 });

  const logoW = 90;
  const logoH = (logoW * logo.height) / logo.width;
  page.drawImage(logo, { x: (W - logoW) / 2, y: 612 - 70 - logoH, width: logoW, height: logoH });

  center("CONSTANCIA DE CAPACITACIÓN", 470, 24, bold);
  center("Otorgada a", 435, 12, font, GRAY);
  center(ctx.user.name, 400, 26, bold);
  page.drawLine({ start: { x: 200, y: 392 }, end: { x: W - 200, y: 392 }, thickness: 1, color: rgb(0.8, 0.85, 0.92) });

  center("Por haber acreditado satisfactoriamente el curso", 360, 12, font, GRAY);
  center(`"${ctx.course.titulo}"`, 332, 18, bold);

  const detalles: string[] = [];
  if (ctx.course.horas) detalles.push(`Duración: ${ctx.course.horas} horas`);
  detalles.push(`Modalidad: ${ctx.course.modalidad === "PRESENCIAL" ? "Presencial" : "Virtual"}`);
  if (ctx.score != null) detalles.push(`Calificación: ${ctx.score}%`);
  center(detalles.join("     ·     "), 300, 11, font);

  center(`Ciudad de México, a ${formatLongDateEs(ctx.fechaCompletado)}`, 250, 11, font);

  // Firma
  page.drawLine({ start: { x: (W - 240) / 2, y: 150 }, end: { x: (W + 240) / 2, y: 150 }, thickness: 1, color: GRAY });
  center("Gente & Gestión — Café Punta del Cielo", 135, 10, font, GRAY);

  center(`Folio: ${ctx.folio}`, 55, 9, font, GRAY);
}

// Formato DC-3 (STPS) — Constancia de Competencias o de Habilidades Laborales.
// Los datos legales de la empresa (RFC) y firmas se dejan en blanco para su llenado/firma.
function drawDC3(page: PDFPage, font: PDFFont, bold: PDFFont, ctx: Ctx) {
  const margin = 50;
  const W = 612;
  let y = 792 - 45;

  const title = (t: string, size = 12) => {
    const w = bold.widthOfTextAtSize(t, size);
    page.drawText(t, { x: (W - w) / 2, y, size, font: bold, color: NAVY });
    y -= size + 6;
  };
  const sectionHeader = (t: string) => {
    y -= 6;
    page.drawRectangle({ x: margin, y: y - 3, width: W - margin * 2, height: 16, color: rgb(0.9, 0.92, 0.96) });
    page.drawText(t, { x: margin + 4, y, size: 9, font: bold, color: NAVY });
    y -= 22;
  };
  const field = (label: string, value: string) => {
    page.drawText(label, { x: margin, y, size: 8.5, font: bold, color: GRAY });
    page.drawText(value || "________________________", { x: margin + 175, y, size: 9, font });
    y -= 18;
  };

  title("FORMATO DC-3", 13);
  title("CONSTANCIA DE COMPETENCIAS O DE HABILIDADES LABORALES", 9);
  y -= 4;
  page.drawText("Secretaría del Trabajo y Previsión Social (STPS)", {
    x: margin, y, size: 8, font, color: GRAY,
  });
  const folioW = font.widthOfTextAtSize(`Folio: ${ctx.folio}`, 9);
  page.drawText(`Folio: ${ctx.folio}`, { x: W - margin - folioW, y, size: 9, font: bold, color: NAVY });
  y -= 18;

  sectionHeader("DATOS DEL TRABAJADOR");
  field("Nombre:", ctx.user.name);
  field("CURP:", ctx.user.curp || "");
  field("Ocupación / Puesto:", ctx.user.puesto || "");
  field("No. de empleado:", ctx.user.employeeCode || "");

  sectionHeader("DATOS DE LA EMPRESA");
  field("Nombre o razón social:", ctx.empresa?.razonSocial ?? "");
  field("RFC (con homoclave):", ctx.empresa?.rfc ?? "");

  sectionHeader("DATOS DEL PROGRAMA / CURSO");
  field("Nombre del curso:", ctx.course.titulo);
  field("Duración en horas:", ctx.course.horas ? String(ctx.course.horas) : "");
  field("Área temática:", ctx.course.categoria || "");
  field("Modalidad:", ctx.course.modalidad === "PRESENCIAL" ? "Presencial" : "En línea / Virtual");
  field(
    "Periodo de ejecución:",
    ctx.course.fechaEvento
      ? formatLongDateEs(ctx.course.fechaEvento)
      : formatLongDateEs(ctx.fechaCompletado)
  );

  sectionHeader("AGENTE CAPACITADOR");
  field("Tipo:", "Capacitación interna");
  field("Instructor:", ctx.course.instructor || "");

  y -= 30;
  const sigW = 210;
  const gap = W - margin * 2 - sigW * 2;
  const drawSig = (x: number, label: string, name: string) => {
    page.drawLine({ start: { x, y }, end: { x: x + sigW, y }, thickness: 1, color: GRAY });
    page.drawText(label, { x, y: y - 12, size: 8.5, font: bold, color: GRAY });
    if (name) page.drawText(name, { x, y: y - 24, size: 8.5, font });
  };
  drawSig(margin, "Nombre y firma del instructor", ctx.course.instructor || "");
  drawSig(margin + sigW + gap, "Nombre y firma del trabajador", ctx.user.name);

  page.drawText(
    "Documento generado por la plataforma interna Mis Gestiones. Capacitación interna; las firmas deben completarse antes de su uso oficial ante la STPS.",
    { x: margin, y: 45, size: 7, font, color: GRAY }
  );
}
