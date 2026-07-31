import * as XLSX from "xlsx";
import { auth } from "@/auth";
import { IMPORT_COLUMNS } from "@/lib/import-columns";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isHR) {
    return new Response("No autorizado.", { status: 403 });
  }

  const sample = {
    Codigo: "1001",
    Nombre: "María López",
    Correo: "maria.lopez@empresa.com",
    CURP: "",
    JefeCodigo: "",
    Area: "Comercial",
    Departamento: "Ventas",
    Puesto: "Analista de Trade Marketing",
    Telefono: "5512345678",
    Categoria: "ADMINISTRATIVO",
    DiasAsignados: 12,
    FechaIngreso: "2022-03-01",
    FechaNacimiento: "1990-07-15",
    Empresa: "CSA",
    EsRRHH: "",
  };

  const sheet = XLSX.utils.json_to_sheet([sample], { header: [...IMPORT_COLUMNS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Colaboradores");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla_colaboradores.xlsx"',
    },
  });
}
