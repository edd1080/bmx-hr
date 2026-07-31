"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { getViewTitle } from "@/lib/nav";
import { getInitials, getAvatarColors } from "@/lib/avatar";
import { NotificationBell } from "@/components/notification-bell";

export function Topbar({
  roleLabel,
  userName,
  userId,
}: {
  roleLabel: string;
  userName: string;
  userId: string;
}) {
  const pathname = usePathname();
  const { crumb, title } = getViewTitle(pathname, roleLabel);
  const avatar = getAvatarColors(userId);

  return (
    <header className="no-print sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-surface px-7 py-3.5">
      <Link href="/dashboard" aria-label="Ir al inicio" className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-azul.png" alt="Bia México Coffee" className="h-9 w-auto" />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-text-muted-3">
          {crumb}
        </div>
        <div className="font-display text-xl font-bold leading-tight text-brand-primary">
          {title}
        </div>
      </div>

      <NotificationBell />

      <Link
        href="/perfil"
        className="flex items-center gap-2.5 border-l border-border pl-3 hover:opacity-80"
      >
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full font-display text-[15px] font-bold"
          style={{ background: avatar.bg, color: avatar.col }}
        >
          {getInitials(userName)}
        </span>
        <div className="leading-tight">
          <div className="text-sm font-bold text-brand-primary">{userName}</div>
          <div className="text-xs text-text-muted-2">{roleLabel}</div>
        </div>
      </Link>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted-2 hover:bg-page hover:text-brand-primary"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 4h4v16h-4" />
          <path d="M10 12H3" />
          <path d="M6 8l-4 4 4 4" />
        </svg>
      </button>
    </header>
  );
}
