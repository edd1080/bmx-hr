export const dynamic = "force-dynamic";

export default function VentaEmpleadosPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[23px] font-bold text-brand-primary">Venta Empleados</h1>
        <p className="mt-0.5 text-sm text-text-muted-2">
          Productos y beneficios con precio de empleado
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-[16px] border border-dashed border-border bg-surface px-8 py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-3xl">
          🛍️
        </span>
        <h2 className="font-display mt-4 text-lg font-bold text-brand-primary">Próximamente</h2>
        <p className="mt-1.5 max-w-md text-sm text-text-muted-2">
          Estamos preparando este espacio. Aquí podrás consultar y solicitar productos con precio
          especial para colaboradores de Café Punta del Cielo.
        </p>
      </div>
    </div>
  );
}
