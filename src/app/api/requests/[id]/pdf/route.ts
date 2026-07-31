import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureFolio } from "@/lib/leave-server";
import type { Prisma } from "@/generated/prisma";
import {
  LEAVE_TYPE_LABELS,
  formatDate,
  formatDays,
  formatLongDateEs,
  computeServiceYearPeriod,
  LeaveType,
} from "@/lib/leave";

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

type LeaveRequestWithRelations = Prisma.LeaveRequestGetPayload<{
  include: { user: true; manager: true };
}>;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("No autenticado.", { status: 401 });
  }

  const { id } = await params;
  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { user: true, manager: true },
  });

  if (!leaveRequest) {
    return new Response("Solicitud no encontrada.", { status: 404 });
  }

  const canView =
    leaveRequest.userId === session.user.id ||
    leaveRequest.managerId === session.user.id ||
    session.user.isHR;

  if (!canView) {
    return new Response("No autorizado.", { status: 403 });
  }

  if (leaveRequest.status !== "APPROVED") {
    return new Response("Solo se puede generar el formato de solicitudes aprobadas.", {
      status: 400,
    });
  }

  const folio = await ensureFolio(leaveRequest.id);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const logoBytes = await readFile(path.join(process.cwd(), "public", "logo-azul.png"));
  const logoImage = await pdfDoc.embedPng(logoBytes);
  const logoWidth = 110;
  const logoHeight = (logoWidth * logoImage.height) / logoImage.width;
  const logoTop = 792 - 50 - logoHeight;
  page.drawImage(logoImage, { x: 60, y: logoTop, width: logoWidth, height: logoHeight });

  const folioLabel = `Folio: ${folio}`;
  const folioWidth = bold.widthOfTextAtSize(folioLabel, 11);
  page.drawText(folioLabel, {
    x: 612 - 60 - folioWidth,
    y: logoTop + logoHeight - 12,
    size: 11,
    font: bold,
    color: rgb(0.11, 0.21, 0.4),
  });
  const subLabel = "Gente & Gestión — Mis Gestiones";
  const subWidth = font.widthOfTextAtSize(subLabel, 10);
  page.drawText(subLabel, {
    x: 612 - 60 - subWidth,
    y: logoTop + logoHeight - 26,
    size: 10,
    font,
    color: rgb(0.54, 0.58, 0.66),
  });
  page.drawLine({
    start: { x: 60, y: logoTop - 12 },
    end: { x: 612 - 60, y: logoTop - 12 },
    thickness: 1.5,
    color: rgb(0.11, 0.21, 0.4),
  });

  if (leaveRequest.type === "VACATION") {
    drawVacationConstancia(page, font, bold, leaveRequest, logoHeight);
  } else {
    drawGenericConformidad(page, font, bold, leaveRequest, logoHeight);
  }

  const pdfBytes = await pdfDoc.save();

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="conformidad_${leaveRequest.user.name.replace(/\s+/g, "_")}.pdf"`,
    },
  });
}

// Matches the company's official "Constancia de Goce de Vacaciones" letter,
// citing article 76 of the Ley Federal del Trabajo. Only used for VACATION
// requests — the other leave types have no equivalent legal citation.
function drawVacationConstancia(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  leaveRequest: LeaveRequestWithRelations,
  logoHeight: number
) {
  const margin = 60;
  const contentWidth = 612 - margin * 2;
  const size = 11;
  const lineHeight = 18;
  let y = 792 - 50 - logoHeight - 60;

  page.drawText("CONSTANCIA DE GOCE DE VACACIONES", {
    x: margin,
    y,
    size: 14,
    font: bold,
  });
  y -= 40;

  const today = formatLongDateEs(new Date());
  const dateLine = `México, ${today}`;
  const dateLineWidth = font.widthOfTextAtSize(dateLine, size);
  page.drawText(dateLine, { x: 612 - margin - dateLineWidth, y, size, font });
  y -= 36;

  page.drawText("Señores", { x: margin, y, size, font });
  y -= lineHeight;
  for (const line of wrapText(
    "CAFÉ MÉXICO (Alta Extracción / Comercializadora Sanbia S.A. de C.V.)",
    bold,
    size,
    contentWidth
  )) {
    page.drawText(line, { x: margin, y, size, font: bold });
    y -= lineHeight;
  }
  page.drawText("Presente.", { x: margin, y, size, font });
  y -= lineHeight * 2;

  const days = formatDays(leaveRequest.days);
  const period = leaveRequest.user.hireDate
    ? computeServiceYearPeriod(leaveRequest.user.hireDate, leaveRequest.startDate)
    : null;
  const periodText = period
    ? `del ${formatLongDateEs(period.start)} al ${formatLongDateEs(period.end)}`
    : "____________________________";

  const bodyText =
    `Por este medio hago constar que del ${formatLongDateEs(leaveRequest.startDate)} al ` +
    `${formatLongDateEs(leaveRequest.endDate)} he gozado ${days} días de vacaciones ` +
    `correspondientes al período comprendido ${periodText}.`;

  for (const line of wrapText(bodyText, font, size, contentWidth)) {
    page.drawText(line, { x: margin, y, size, font });
    y -= lineHeight;
  }
  y -= lineHeight;

  const legalText =
    "Para los efectos legales del artículo 76 de la Ley Federal del Trabajo (LFT), extiendo la presente constancia.";
  for (const line of wrapText(legalText, font, size, contentWidth)) {
    page.drawText(line, { x: margin, y, size, font });
    y -= lineHeight;
  }
  y -= lineHeight * 2;

  page.drawText("Atentamente,", { x: margin, y, size, font });
  y -= lineHeight * 4;

  page.drawText(`Nombre del Trabajador:  ${leaveRequest.user.name}`, {
    x: margin,
    y,
    size,
    font,
  });
  y -= lineHeight * 2;
  page.drawText(`CURP: ${leaveRequest.user.curp || "________________________________"}`, {
    x: margin,
    y,
    size,
    font,
  });
  y -= lineHeight * 2;
  page.drawText(
    `Número de Empleado: ${leaveRequest.user.employeeCode || "____________________________"}`,
    { x: margin, y, size, font }
  );
  y -= lineHeight * 2;
  page.drawText("Firma ____________________________", { x: margin, y, size, font });

  drawHrUseBox(page, font);
}

// Internal HR paperwork box replicated from the company's printed form —
// blank checkboxes for SAP registration filed by hand after the fact.
function drawHrUseBox(page: PDFPage, font: PDFFont) {
  const boxX = 612 - 60 - 190;
  const boxY = 40;
  const boxWidth = 190;
  const boxHeight = 70;

  page.drawRectangle({
    x: boxX,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
    borderColor: rgb(0.4, 0.4, 0.4),
    borderWidth: 1,
  });

  const lines = ["USO RRHH:", "REGISTRO SAP   SI ( )   NO ( )", "HOJA ( )", "FECHA_____________"];
  let ly = boxY + boxHeight - 16;
  for (const line of lines) {
    page.drawText(line, { x: boxX + 8, y: ly, size: 8.5, font });
    ly -= 15;
  }
}

function drawGenericConformidad(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  leaveRequest: LeaveRequestWithRelations,
  logoHeight: number
) {
  const margin = 60;
  let y = 792 - 50 - logoHeight - 50;
  const lineHeight = 22;

  function drawLine(label: string, value: string, size = 11) {
    page.drawText(label, { x: margin, y, size, font: bold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(value, { x: margin + 160, y, size, font, color: rgb(0.1, 0.1, 0.1) });
    y -= lineHeight;
  }

  page.drawText("Formato de Conformidad de Permiso", {
    x: margin,
    y,
    size: 16,
    font: bold,
  });
  y -= 40;

  const typeLabel = LEAVE_TYPE_LABELS[leaveRequest.type as LeaveType];

  drawLine("Colaborador:", leaveRequest.user.name);
  drawLine("Código de empleado:", leaveRequest.user.employeeCode || "—");
  drawLine("Área:", leaveRequest.user.area || "—");
  drawLine("Jefe directo:", leaveRequest.manager?.name || "—");
  y -= 6;
  drawLine("Tipo de solicitud:", typeLabel);
  drawLine("Fecha:", formatDate(leaveRequest.startDate));
  drawLine("Días:", formatDays(leaveRequest.days));
  if (leaveRequest.reason) drawLine("Motivo:", leaveRequest.reason);
  if (leaveRequest.managerComment) drawLine("Comentario del jefe:", leaveRequest.managerComment);
  drawLine(
    "Fecha de aprobación:",
    leaveRequest.decidedAt ? leaveRequest.decidedAt.toLocaleDateString("es-MX") : "—"
  );

  y -= 30;
  page.drawText(
    "Por medio del presente, ambas partes manifiestan su conformidad con los términos",
    { x: margin, y, size: 10.5, font }
  );
  y -= 15;
  page.drawText("de la solicitud descrita anteriormente.", { x: margin, y, size: 10.5, font });

  y -= 90;
  const sigWidth = 200;
  page.drawLine({
    start: { x: margin, y },
    end: { x: margin + sigWidth, y },
    thickness: 1,
    color: rgb(0.3, 0.3, 0.3),
  });
  page.drawLine({
    start: { x: margin + 260, y },
    end: { x: margin + 260 + sigWidth, y },
    thickness: 1,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 16;
  page.drawText("Firma del colaborador", { x: margin, y, size: 10, font });
  page.drawText("Firma del jefe directo", { x: margin + 260, y, size: 10, font });
  y -= 14;
  page.drawText(leaveRequest.user.name, { x: margin, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(leaveRequest.manager?.name || "", {
    x: margin + 260,
    y,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
}
