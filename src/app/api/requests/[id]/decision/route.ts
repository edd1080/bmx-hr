import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { LEAVE_TYPE_LABELS, type LeaveType } from "@/lib/leave";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const { user: currentUser } = authResult.context;
  const { id } = await params;
  const { action, comment } = (await request.json()) as {
    action: "APPROVE" | "REJECT";
    comment?: string;
  };

  if (action !== "APPROVE" && action !== "REJECT") {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!leaveRequest) {
    return NextResponse.json({ error: "Solicitud no encontrada." }, { status: 404 });
  }

  // Permiso estricto: Solo el Jefe Directo asignado o Gente & Gestion (HR) pueden aprobar/rechazar
  const canDecide =
    leaveRequest.managerId === currentUser.id || currentUser.isHR;

  if (!canDecide) {
    return NextResponse.json(
      { error: "No tienes autorización para resolver esta solicitud." },
      { status: 403 }
    );
  }

  if (leaveRequest.status !== "PENDING") {
    return NextResponse.json(
      { error: "Esta solicitud ya fue resuelta." },
      { status: 400 }
    );
  }

  const status = action === "APPROVE" ? "APPROVED" : "REJECTED";

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status,
      managerComment: comment || null,
      decidedAt: new Date(),
      managerId: currentUser.id,
    },
  });

  const typeLabel = LEAVE_TYPE_LABELS[leaveRequest.type as LeaveType] ?? leaveRequest.type;
  const verb = status === "APPROVED" ? "aprobó" : "rechazó";
  await notify(
    leaveRequest.userId,
    `Tu solicitud de ${typeLabel} (${leaveRequest.days} día${leaveRequest.days === 1 ? "" : "s"}) fue ${verb === "aprobó" ? "aprobada" : "rechazada"}.`,
    updated.id
  );

  return NextResponse.json({ ok: true, request: updated });
}
