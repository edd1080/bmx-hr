"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { getViewTitle } from "@/lib/nav";
import { getInitials, getAvatarColors } from "@/lib/avatar";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";

export type NavItem = { label: string; href: string; icon: IconKey; badge?: number };
export type NavGroup = { label: string | null; items: NavItem[] };

type IconKey =
  | "inicio" | "vacaciones" | "venta" | "beneficios" | "mesa" | "firma" | "organigrama"
  | "equipo" | "metasEquipo" | "colaboradores" | "solicitudes" | "panel" | "importar"
  | "constancias" | "metasCompania" | "onboarding" | "metas";

// Registro de íconos (SVG en línea, heredan color del contorno).
const ICONS: Record<IconKey, React.ReactNode> = {
  inicio: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
  vacaciones: <><path d="M12 2a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9Z" /><path d="M12 11v9" /><path d="M9 22h6" /></>,
  venta: <><path d="M6 2 3 6v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>,
  beneficios: <><path d="M20 12v9H4v-9" /><path d="M2 7h20v5H2z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z" /></>,
  mesa: <><path d="M4 14v-3a8 8 0 0 1 16 0v3" /><path d="M4 14a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2z" /><path d="M20 14a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2z" /><path d="M18 17a4 4 0 0 1-4 3h-2" /></>,
  firma: <><path d="M3 19c2 0 3-2 4.5-2S9 19 11 19s3-6 5-6" /><path d="M12 15 20 7l-3-3-8 8-1 4z" /></>,
  organigrama: <><circle cx="12" cy="5" r="2.3" /><circle cx="5.5" cy="18" r="2.3" /><circle cx="18.5" cy="18" r="2.3" /><path d="M12 7.3v4M12 11.3 5.5 15.7M12 11.3l6.5 4.4" /></>,
  equipo: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.4" /><path d="M3.5 19c.6-3.4 2.9-5 5.5-5s4.9 1.6 5.5 5" /><path d="M15 14.3c2.2.2 3.9 1.6 4.4 4.7" /></>,
  metasEquipo: <><path d="M9 12l2 2 4-4" /><path d="M21 12a9 9 0 1 1-3.5-7.1" /></>,
  colaboradores: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.6-3.4 2.9-5 5.5-5s4.9 1.6 5.5 5" /><path d="M17 7l2 2 3-3" /></>,
  solicitudes: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 2h6v3H9z" /><path d="M9 12l2 2 4-4" /></>,
  panel: <><path d="M4 20V10M12 20V4M20 20v-7" /></>,
  importar: <><path d="M12 15V3m0 12-4-4m4 4 4-4" transform="rotate(180 12 9)" /><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></>,
  constancias: <><path d="M14 2H6v20h12V8z" /><path d="M14 2v6h6" /></>,
  metasCompania: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.2" /><circle cx="12" cy="12" r="0.6" fill="currentColor" /></>,
  onboarding: <><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="12" r="3" /><path d="M9 6h4a2 2 0 0 1 2 2v1M9 18h4a2 2 0 0 0 2-2v-1" /></>,
  metas: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.2" /><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" /></>,
};

function Icon({ name }: { name: IconKey }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  );
}

export function AppShell({
  nav,
  user,
  children,
}: {
  nav: NavGroup[];
  user: { name: string; roleLabel: string; id: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { crumb, title } = getViewTitle(pathname, user.roleLabel);
  const avatar = getAvatarColors(user.id);

  // Recordar el estado colapsado entre sesiones.
  useEffect(() => {
    setCollapsed(localStorage.getItem("sidebarCollapsed") === "1");
  }, []);
  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("sidebarCollapsed", next ? "1" : "0");
      return next;
    });
  }

  // Cerrar el cajón móvil al navegar.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="flex min-h-screen">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`no-print fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-surface transition-all duration-200 md:static md:translate-x-0 ${
          collapsed ? "w-16" : "w-60"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Marca + colapsar */}
        <div className={`flex items-center gap-2 px-3 py-3.5 ${collapsed ? "justify-center" : ""}`}>
          <Link href="/dashboard" aria-label="Inicio" className="flex items-center gap-2 overflow-hidden">
            {collapsed ? (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-brand-navy font-display text-[13px] font-extrabold text-white">
                b
              </span>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src="/logo-azul.png" alt="Bia México Coffee" className="h-7 w-auto" />
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              aria-label="Colapsar panel"
              className="ml-auto hidden h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted hover:bg-page md:flex"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 6l-6 6 6 6" /></svg>
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={toggleCollapsed}
            aria-label="Expandir panel"
            className="mx-auto mb-1 hidden h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted hover:bg-page md:flex"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 6l6 6-6 6" /></svg>
          </button>
        )}

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-2 py-1">
          {nav.map((group, gi) => (
            <div key={gi} className="mb-1">
              {group.label && !collapsed && (
                <div className="px-2.5 pb-1 pt-3 text-[10px] font-extrabold uppercase tracking-[0.11em] text-text-muted-3">
                  {group.label}
                </div>
              )}
              {group.label && collapsed && gi > 0 && <div className="mx-2 my-2 border-t border-divider" />}
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={`relative flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13px] font-bold transition-colors ${
                          collapsed ? "justify-center" : ""
                        } ${
                          active
                            ? "bg-vacation-bg text-brand-primary"
                            : "text-text-secondary hover:bg-page"
                        }`}
                      >
                        <span className={`h-[18px] w-[18px] shrink-0 ${active ? "text-brand-accent" : "text-text-muted-2"}`}>
                          <Icon name={item.icon} />
                        </span>
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!!item.badge && item.badge > 0 && (
                          <span
                            className={`rounded-full bg-danger px-1.5 text-[10px] font-extrabold leading-4 text-white ${
                              collapsed ? "absolute right-1 top-1 px-1" : "ml-auto"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Usuario */}
        <div className={`flex items-center gap-2.5 border-t border-divider px-3 py-3 ${collapsed ? "justify-center" : ""}`}>
          <Link href="/perfil" aria-label="Mi perfil">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full font-display text-[13px] font-bold"
              style={{ background: avatar.bg, color: avatar.col }}
            >
              {getInitials(user.name)}
            </span>
          </Link>
          {!collapsed && (
            <>
              <Link href="/perfil" className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12.5px] font-bold text-brand-primary">{user.name}</div>
                <div className="truncate text-[11px] text-text-muted-2">{user.roleLabel}</div>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted-2 hover:bg-page hover:text-brand-primary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 4h4v16h-4" /><path d="M10 12H3" /><path d="M6 8l-4 4 4 4" /></svg>
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Columna principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-surface px-4 py-3 md:px-7">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted md:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted-3">{crumb}</div>
            <div className="font-display text-lg font-bold leading-tight text-brand-primary md:text-xl">{title}</div>
          </div>
          <ThemeToggle />
          <NotificationBell />
        </header>
        <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-5 md:px-7 md:py-7">{children}</main>
      </div>
    </div>
  );
}
