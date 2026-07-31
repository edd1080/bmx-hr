"use client";

import { useMemo, useState } from "react";
import type { OrgPerson } from "@/lib/org";
import { getAncestorChain, getDepartamentos, getDirectReports, searchPeople } from "@/lib/org";
import { OrgPersonCard } from "@/components/org-person-card";
import { OrgDetailPanel } from "@/components/org-detail-panel";

export function OrgChartBrowser({
  people,
  rootIds,
  currentUserId,
}: {
  people: OrgPerson[];
  rootIds: string[];
  currentUserId: string;
}) {
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const departamentos = useMemo(() => getDepartamentos(people), [people]);

  const initialFocusId = byId.has(currentUserId) ? currentUserId : (rootIds[0] ?? people[0]?.id ?? "");
  const [focusId, setFocusId] = useState(initialFocusId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showRoots, setShowRoots] = useState(false);
  const [query, setQuery] = useState("");
  const [departamento, setDepartamento] = useState<string | null>(null);

  const searching = query.trim().length > 0 || departamento !== null;

  const chain = useMemo(() => getAncestorChain(people, focusId), [people, focusId]);
  const focusPerson = byId.get(focusId);
  const directReports = useMemo(
    () => (focusPerson ? getDirectReports(people, focusPerson.id) : []),
    [people, focusPerson]
  );
  const results = useMemo(
    () => (searching ? searchPeople(people, query, departamento) : []),
    [people, query, departamento, searching]
  );

  // El panel de la derecha es bajo demanda: solo aparece cuando se hace clic
  // en el ícono de "ver ficha" de una tarjeta, no por defecto.
  const selectedPerson = selectedId ? byId.get(selectedId) : undefined;
  const selectedManager =
    selectedPerson?.managerId ? (byId.get(selectedPerson.managerId) ?? null) : null;

  function focusOn(id: string) {
    setFocusId(id);
    setSelectedId(null);
    setShowRoots(false);
    setQuery("");
    setDepartamento(null);
  }

  function goToTop() {
    if (rootIds.length <= 1) {
      if (rootIds[0]) focusOn(rootIds[0]);
      return;
    }
    setShowRoots(true);
    setQuery("");
    setDepartamento(null);
  }

  return (
    <div
      className={`grid grid-cols-1 items-start gap-5 ${selectedPerson ? "lg:grid-cols-[1fr_300px]" : ""}`}
    >
      <div>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-[10px] border-[1.5px] border-border-input bg-surface px-3.5 py-2.5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8A94A9" strokeWidth="2">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m20 20-4.3-4.3" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o puesto…"
              className="w-full border-none bg-transparent text-sm text-brand-primary outline-none"
            />
          </div>
          <select
            value={departamento ?? ""}
            onChange={(e) => setDepartamento(e.target.value || null)}
            className="rounded-[10px] border-[1.5px] border-border-input bg-surface px-3.5 py-2.5 text-sm text-brand-primary outline-none focus:border-brand-accent"
          >
            <option value="">Todos los departamentos</option>
            {departamentos.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={goToTop}
            className="rounded-[10px] border-[1.5px] border-border-input bg-surface px-3.5 py-2.5 text-xs font-bold text-text-secondary"
          >
            Ver desde arriba
          </button>
        </div>

        {searching ? (
          <div className="rounded-[14px] border border-border bg-surface p-5">
            <div className="mb-3 text-xs font-semibold text-text-muted-2">
              {results.length} resultado{results.length === 1 ? "" : "s"}
            </div>
            {results.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-muted-3">Sin resultados para ese filtro.</p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
                {results.map((p) => (
                  <OrgPersonCard
                    key={p.id}
                    person={p}
                    variant="flat"
                    onClick={() => focusOn(p.id)}
                    onShowDetail={() => setSelectedId(p.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : showRoots ? (
          <div className="rounded-[14px] border border-border bg-surface p-5">
            {rootIds.length > 1 && (
              <p className="mb-3 text-xs text-text-muted-3">
                Estas {rootIds.length} personas no tienen jefe asignado en el Excel maestro — es probable
                que falte capturar su &quot;Jefe Inmediato&quot;. Gente y Gestión puede corregirlo en el
                próximo importe.
              </p>
            )}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
              {rootIds
                .map((id) => byId.get(id))
                .filter((p): p is OrgPerson => !!p)
                .map((p) => (
                  <OrgPersonCard
                    key={p.id}
                    person={p}
                    variant="flat"
                    onClick={() => focusOn(p.id)}
                    onShowDetail={() => setSelectedId(p.id)}
                  />
                ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[14px] border border-border bg-surface p-6">
            <div className="mx-auto flex max-w-[420px] flex-col items-center gap-0">
              {chain.map((p, i) => (
                <div key={p.id} className="flex w-full flex-col items-center">
                  {i > 0 && <div className="h-4 w-px bg-border-input" />}
                  <OrgPersonCard
                    person={p}
                    variant="spine"
                    active={p.id === focusPerson?.id}
                    onClick={() => focusOn(p.id)}
                    onShowDetail={() => setSelectedId(p.id)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-dashed border-border pt-5">
              <div className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-text-muted-2">
                {directReports.length > 0
                  ? `Reportan directo a ${focusPerson?.name.split(" ")[0]} (${directReports.length})`
                  : "Sin reportes directos"}
              </div>
              {directReports.length > 0 && (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
                  {directReports.map((p) => (
                    <OrgPersonCard
                      key={p.id}
                      person={p}
                      variant="grid"
                      onClick={() => focusOn(p.id)}
                      onShowDetail={() => setSelectedId(p.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedPerson && (
        <OrgDetailPanel
          person={selectedPerson}
          manager={selectedManager}
          onFocus={focusOn}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
