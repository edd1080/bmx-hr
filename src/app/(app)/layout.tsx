import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isManager as checkIsManager } from "@/lib/leave-server";
import { ensureBirthdayNotification } from "@/lib/birthdays";
import { ensureCapacitacionReminders } from "@/lib/capacitacion-reminders";
import { countPendingForUser } from "@/lib/firma-server";
import { AppShell, type NavGroup } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const isHR = session!.user.isHR;
  const isManager = await checkIsManager(userId);
  // Gerente N1 del módulo Onboarding: es titular (gerente) de alguna Dirección.
  const n1Direccion = isHR
    ? null
    : await prisma.direccion.findFirst({ where: { gerenteN1Id: userId }, select: { id: true } });
  const isN1 = !!n1Direccion;
  const roleLabel = isHR ? "Gente & Gestión" : isManager ? "Jefe inmediato" : "Colaborador";

  // Sin cron: la felicitación se crea de forma perezosa la primera vez que la
  // persona abre la app el día de su cumpleaños (idempotente por año).
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, birthDate: true, activo: true },
  });
  // Si el colaborador fue dado de baja mientras tenía sesión abierta, se le bloquea.
  if (!me || !me.activo) redirect("/login");

  // Notificaciones perezosas en segundo plano (sin bloquear el render del layout)
  Promise.all([
    ensureBirthdayNotification(userId, me.birthDate, me.name),
    ensureCapacitacionReminders(userId),
  ]).catch(() => {});

  // Conteos para las insignias del panel (solo lo que aplica al rol).
  const [pendingApprovals, pendingMetaReviews, pendingToRegister, pendingFirmas] = await Promise.all([
    isManager
      ? prisma.leaveRequest.count({ where: { managerId: userId, status: "PENDING" } })
      : Promise.resolve(0),
    isManager
      ? prisma.meta.count({ where: { managerId: userId, estado: "EN_REVISION" } })
      : Promise.resolve(0),
    isHR
      ? prisma.leaveRequest.count({ where: { status: "APPROVED", pdfGeneratedAt: null } })
      : Promise.resolve(0),
    countPendingForUser(userId),
  ]);

  const nav: NavGroup[] = [
    { label: null, items: [{ label: "Inicio", href: "/dashboard", icon: "inicio" }] },
    {
      label: "Servicios",
      items: [
        { label: "Vacaciones y permisos", href: "/perfil", icon: "vacaciones" },
        { label: "Beneficios", href: "/beneficios", icon: "beneficios" },
        { label: "Mesa de ayuda", href: "/mesa-ayuda", icon: "mesa" },
        { label: "Firma electrónica", href: "/firma", icon: "firma", badge: pendingFirmas },
        { label: "Organigrama", href: "/organigrama", icon: "organigrama" },
      ],
    },
  ];

  if (isManager) {
    nav.push({
      label: "Mi equipo",
      items: [
        { label: "Dashboard de mi equipo", href: "/equipo", icon: "equipo", badge: pendingApprovals },
        { label: "Metas de mi equipo", href: "/equipo/metas", icon: "metasEquipo", badge: pendingMetaReviews },
      ],
    });
  }

  if (isHR) {
    nav.push({
      label: "Gente & Gestión",
      items: [
        { label: "Colaboradores", href: "/admin/colaboradores", icon: "colaboradores" },
        { label: "Solicitudes", href: "/admin/solicitudes", icon: "solicitudes", badge: pendingToRegister },
        { label: "Onboarding", href: "/onboarding", icon: "onboarding" },
        { label: "Panel maestro", href: "/admin", icon: "panel" },
        { label: "Importar base", href: "/admin/importar", icon: "importar" },
        { label: "Constancias", href: "/admin/constancias", icon: "constancias" },
        { label: "Metas de la compañía", href: "/admin/metas", icon: "metasCompania" },
      ],
    });
  } else if (isN1) {
    nav.push({
      label: "Mi dirección",
      items: [{ label: "Onboarding", href: "/onboarding", icon: "onboarding" }],
    });
  }

  return (
    <AppShell nav={nav} user={{ name: session!.user.name!, roleLabel, id: userId }}>
      {children}
    </AppShell>
  );
}
