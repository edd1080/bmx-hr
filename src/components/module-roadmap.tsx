type RoadmapItem = { label: string; done?: boolean };

// Tarjeta que documenta dentro de la propia app las funciones planeadas de un
// módulo: lo que ya está disponible (✓) y lo que viene en construcción (reloj).
export function ModuleRoadmap({
  title = "Funciones del módulo",
  intro,
  items,
}: {
  title?: string;
  intro?: string;
  items: RoadmapItem[];
}) {
  const done = items.filter((i) => i.done).length;

  return (
    <div className="rounded-[16px] border border-border bg-surface p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-[16.5px] font-bold text-brand-primary">{title}</h2>
        <span className="rounded-full bg-page px-3 py-1 text-xs font-semibold text-text-muted-2">
          {done} de {items.length} disponibles
        </span>
      </div>
      {intro && <p className="mb-4 text-sm text-text-muted-2">{intro}</p>}

      <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-2.5">
            {item.done ? (
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-bg text-success">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
            ) : (
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-page text-text-muted-3">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </span>
            )}
            <span className={`text-[13.5px] ${item.done ? "font-semibold text-brand-primary" : "text-text-secondary"}`}>
              {item.label}
              {!item.done && <span className="ml-1.5 text-[11px] text-text-muted-3">· en construcción</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
