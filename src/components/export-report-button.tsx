"use client";

import * as XLSX from "xlsx";
import { useToast } from "@/components/toast-provider";
import { LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS, formatDate, formatDays, LeaveType, LeaveStatus } from "@/lib/leave";

type ExportRow = {
  nombre: string;
  area: string | null;
  departamento: string | null;
  tipo: string;
  startDate: Date;
  endDate: Date;
  dias: number;
  jefe: string | null;
  estatus: string;
};

export function ExportReportButton({ rows }: { rows: ExportRow[] }) {
  const showToast = useToast();

  function handleExport() {
    const data = rows.map((r) => ({
      Colaborador: r.nombre,
      Área: r.area || "",
      Departamento: r.departamento || "",
      Tipo: LEAVE_TYPE_LABELS[r.tipo as LeaveType] ?? r.tipo,
      Desde: formatDate(r.startDate),
      Hasta: formatDate(r.endDate),
      Días: formatDays(r.dias),
      "Jefe inmediato": r.jefe || "",
      Estatus: LEAVE_STATUS_LABELS[r.estatus as LeaveStatus] ?? r.estatus,
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Reporte");
    XLSX.writeFile(workbook, "reporte_ausencias.xlsx");
    showToast("Reporte exportado a Excel");
  }

  return (
    <button
      onClick={handleExport}
      className="ml-auto flex items-center gap-2 rounded-[9px] bg-brand-navy px-4 py-2.5 text-[13px] font-bold text-white"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
        <path d="M12 3v12M8 11l4 4 4-4M4 21h16" />
      </svg>
      Exportar reporte
    </button>
  );
}
