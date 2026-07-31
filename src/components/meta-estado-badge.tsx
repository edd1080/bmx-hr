import { META_ESTADO_LABELS, META_ESTADO_STYLES, MetaEstado } from "@/lib/metas";

export function MetaEstadoBadge({ estado }: { estado: string }) {
  const e = (estado as MetaEstado) in META_ESTADO_STYLES ? (estado as MetaEstado) : "BORRADOR";
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${META_ESTADO_STYLES[e]}`}>
      {META_ESTADO_LABELS[e]}
    </span>
  );
}
