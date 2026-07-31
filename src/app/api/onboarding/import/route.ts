import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { auth } from "@/auth";
import { parseOrgRow, importOrganigrama } from "@/lib/onboarding-import";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isHR) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Sube un archivo CSV o Excel." }, { status: 400 });
  }

  let rows;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    // codepage 65001 = UTF-8: evita que un CSV con acentos (Área, Posición) se
    // lea como Latin-1 y se pierdan esas columnas. Se ignora para .xlsx binario.
    const wb = XLSX.read(buffer, { type: "buffer", codepage: 65001 });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    rows = raw.map(parseOrgRow);
  } catch {
    return NextResponse.json({ error: "No se pudo leer el archivo." }, { status: 400 });
  }

  const result = await importOrganigrama(rows);
  return NextResponse.json({ result });
}
