import Link from "next/link";

const RH_TABS = [
  { href: "/onboarding", label: "Dashboard" },
  { href: "/onboarding/ingresos", label: "Nuevos ingresos" },
  { href: "/onboarding/matriz", label: "Matriz de relaciones" },
  { href: "/onboarding/notificaciones", label: "Notificaciones" },
  { href: "/onboarding/importar", label: "Importar organigrama" },
];
const N1_TABS = [
  { href: "/onboarding", label: "Mis posiciones" },
  { href: "/onboarding/notificaciones", label: "Notificaciones" },
];

export function OnboardingTabs({ active, isRh }: { active: string; isRh: boolean }) {
  const tabs = isRh ? RH_TABS : N1_TABS;
  return (
    <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`-mb-px border-b-2 px-3.5 py-2.5 text-[13px] font-bold ${
            active === t.href
              ? "border-brand-accent text-brand-primary"
              : "border-transparent text-text-muted-2 hover:text-brand-primary"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
