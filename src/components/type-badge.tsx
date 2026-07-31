import { LEAVE_TYPE_LABELS, LEAVE_TYPE_STYLES, LeaveType } from "@/lib/leave";

export function TypeBadge({ type }: { type: string }) {
  const t = (type as LeaveType) in LEAVE_TYPE_STYLES ? (type as LeaveType) : "VACATION";
  return (
    <span
      className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold ${LEAVE_TYPE_STYLES[t]}`}
    >
      {LEAVE_TYPE_LABELS[t]}
    </span>
  );
}
