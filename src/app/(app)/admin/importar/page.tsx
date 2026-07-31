import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { IMPORT_COLUMNS, IMPORT_COLUMN_NOTES } from "@/lib/import-columns";
import { ImportForm } from "@/components/import-form";

export default async function ImportarPage() {
  const session = await auth();
  if (!session?.user?.isHR) redirect("/dashboard");

  return (
    <div className="space-y-5">
      <div className="rounded-[14px] border border-border bg-surface p-5">
        <h2 className="font-display text-[16.5px] font-bold text-brand-primary">
          1. Descarga la plantilla
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Llena una fila por colaborador con estas columnas:
        </p>
        <ul className="mt-3 space-y-1 text-sm text-text-secondary">
          {IMPORT_COLUMNS.map((col) => (
            <li key={col}>
              <span className="font-mono font-semibold text-brand-primary">{col}</span>{" "}
              — {IMPORT_COLUMN_NOTES[col]}
            </li>
          ))}
        </ul>
        <a
          href="/api/admin/import-template"
          className="mt-4 inline-block rounded-[9px] border-[1.5px] border-brand-primary px-4 py-2 text-sm font-bold text-brand-primary hover:bg-brand-primary/5"
        >
          Descargar plantilla (.xlsx)
        </a>
      </div>

      <div className="rounded-[14px] border border-border bg-surface p-5">
        <h2 className="font-display text-[16.5px] font-bold text-brand-primary">
          2. Sube el archivo y revisa la vista previa
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Nada se guarda hasta que confirmes. Primero verás un resumen de{" "}
          <b>altas</b>, <b>cambios</b> (con el detalle de qué campo cambia),{" "}
          <b>bajas</b> y <b>errores</b>. Los colaboradores existentes se actualizan por
          Código (no se duplican) y los jefes directos se enlazan solos. Antes de aplicar
          se genera un <b>respaldo automático</b> de la base de datos.
        </p>
        <div className="mt-2 rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Una celda <b>vacía</b> en el Excel <b>no borra</b> el dato que ya exista en la app:
          solo se actualizan los campos que traigas con información.
        </div>
        <div className="mt-4">
          <ImportForm />
        </div>
      </div>
    </div>
  );
}
