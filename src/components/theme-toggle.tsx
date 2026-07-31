"use client";

import { useEffect, useState } from "react";

function applyTheme(dark: boolean) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  try {
    localStorage.setItem("theme", dark ? "dark" : "light");
  } catch {
    /* almacenamiento no disponible */
  }
}

const SunIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
  </svg>
);
const MoonIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
  </svg>
);

/** Botón compacto (para la barra superior). */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    applyTheme(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={dark ? "Modo claro" : "Modo oscuro"}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted-2 hover:bg-page hover:text-brand-primary"
    >
      {dark ? SunIcon : MoonIcon}
    </button>
  );
}

/** Interruptor con etiqueta (para la tarjeta "Apariencia" de Mi Perfil). */
export function ThemeSwitch() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    applyTheme(next);
  }

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={dark}
      aria-label="Modo oscuro"
      className={`relative h-7 w-[52px] shrink-0 rounded-full border transition-colors ${
        dark ? "border-brand-accent bg-brand-accent" : "border-border bg-divider"
      }`}
    >
      <span
        className={`absolute top-[2px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white text-brand-navy shadow transition-all ${
          dark ? "left-[26px]" : "left-[2px]"
        }`}
      >
        {dark ? MoonIcon : SunIcon}
      </span>
    </button>
  );
}
