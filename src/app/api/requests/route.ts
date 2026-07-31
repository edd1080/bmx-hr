import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import {
  countBusinessDays,
  LEAVE_TYPES,
  LEAVE_TYPE_LABELS,
  availableLeaveTypes,
  isSingleDayLeaveType,
  formatDate,
  LeaveType,
} from "@/lib/leave";
import { getVacationBalance } from "@/lib/leave-server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const { type, startDate, endDate, reason } = body as {
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
  };

  if (!LEAVE_TYPES.includes(type as LeaveType)) {
    return NextResponse.json({ error: "Tipo de solicitud inválido." }, { status: 400 });
  }

  const requester = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });

  if (!availableLeaveTypes(requester.category).includes(type as LeaveType)) {
    return NextResponse.json(
      { error: "Este tipo de solicitud no está disponible para tu categoría." },
      { status: 400 }
    );
  }

  const start = new Date(startDate);
  let end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "Fechas inválidas." }, { status: 400 });
  }

  let days: number;

  if (isSingleDayLeaveType(type)) {
    end = start;
    if (type === "EARLY_FRIDAY" && start.getUTCDay() !== 5) {
      return NextResponse.json(
        { error: "Early Friday solo se puede solicitar para un día viernes." },
        { status: 400 }
      );
    }
    days = 0.5;
  } else {
    if (end < start) {
      return NextResponse.json({ error: "Fechas inválidas." }, { status: 400 });
    }
    days = countBusinessDays(start, end);
    if (days <= 0) {
      return NextResponse.json(
        { error: "El rango de fechas no incluye días hábiles." },
        { status: 400 }
      );
    }

    const balance = await getVacationBalance(session.user.id);
    if (days > balance.available) {
      return NextResponse.json(
        {
          error: `No tienes suficientes días disponibles (disponibles: ${balance.available}, solicitados: ${days}).`,
        },
        { status: 400 }
      );
    }
  }

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      userId: requester.id,
      type,
      startDate: start,
      endDate: end,
      days,
      reason: reason || null,
      managerId: requester.managerId,
    },
  });

  const typeLabel = LEAVE_TYPE_LABELS[type as LeaveType];
  const dateRange =
    start.getTime() === end.getTime()
      ? formatDate(start)
      : `del ${formatDate(start)} al ${formatDate(end)}`;
  const message = `${requester.name} solicitó ${typeLabel} (${days} día${days === 1 ? "" : "s"}) ${dateRange}.`;

  if (requester.managerId) {
    await notify(requester.managerId, message, leaveRequest.id);
  } else {
    const hrUsers = await prisma.user.findMany({
      where: { isHR: true, id: { not: requester.id } },
      select: { id: true },
    });
    await Promise.all(hrUsers.map((u) => notify(u.id, message, leaveRequest.id)));
  }

  return NextResponse.json({ ok: true, request: leaveRequest });
}
