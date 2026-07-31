import { getInitials, getAvatarColors } from "@/lib/avatar";
import { EliminarBoton } from "@/components/comunicacion/eliminar-boton";
import { RECONOCE_META, type ReconoceCategoria } from "@/lib/comunicacion";

export type ReconocimientoCardData = {
  id: string;
  deId: string;
  deName: string;
  paraId: string;
  paraName: string;
  categoria: string;
  mensaje: string;
};

export function ReconocimientoCard({
  rec,
  canDelete,
}: {
  rec: ReconocimientoCardData;
  canDelete: boolean;
}) {
  const m = RECONOCE_META[rec.categoria as ReconoceCategoria] ?? RECONOCE_META.GRACIAS;
  const avatarDe = getAvatarColors(rec.deId);
  const avatarPara = getAvatarColors(rec.paraId);

  return (
    <article className="overflow-hidden rounded-[16px] border border-border bg-surface shadow-sm">
      <div
        className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide"
        style={{ background: m.bg, color: m.text }}
      >
        <span className="text-sm">{m.icon}</span>
        Reconocimiento · {m.label}
        {canDelete && (
          <span className="ml-auto">
            <EliminarBoton
              url={`/api/reconocimientos/${rec.id}`}
              confirmMsg="¿Eliminar este reconocimiento?"
              okMsg="Reconocimiento eliminado"
            />
          </span>
        )}
      </div>

      <div className="px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[12px] font-bold"
            style={{ background: avatarDe.bg, color: avatarDe.col }}
          >
            {getInitials(rec.deName)}
          </span>
          <span className="text-sm font-semibold text-text-secondary">{rec.deName}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted-3">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[12px] font-bold"
            style={{ background: avatarPara.bg, color: avatarPara.col }}
          >
            {getInitials(rec.paraName)}
          </span>
          <span className="text-sm font-bold text-brand-primary">{rec.paraName}</span>
        </div>

        <p className="mt-3 whitespace-pre-wrap text-[14.5px] leading-relaxed text-text-secondary">
          {rec.mensaje}
        </p>
      </div>
    </article>
  );
}
