import { LEAVE_STATUS_LABELS, LEAVE_STATUS_STYLES, LeaveStatus } from "@/lib/leave";

export function StatusBadge({ status }: { status: string }) {
  const s = (status as LeaveStatus) in LEAVE_STATUS_STYLES ? (status as LeaveStatus) : "PENDING";
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${LEAVE_STATUS_STYLES[s]}`}
    >
      {LEAVE_STATUS_LABELS[s]}
    </span>
  );
}
