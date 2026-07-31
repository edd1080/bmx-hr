import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/equipo",
  "/admin",
  "/comunicacion",
  "/capacitacion",
  "/beneficios",
  "/mesa-ayuda",
  "/firma",
  "/onboarding",
  "/cambiar-password",
  "/perfil",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn) {
    const mustChangePassword = req.auth?.user?.mustChangePassword === true;

    if (mustChangePassword && pathname !== "/cambiar-password") {
      return NextResponse.redirect(new URL("/cambiar-password", req.url));
    }

    if (!mustChangePassword && pathname === "/cambiar-password") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/equipo/:path*",
    "/admin/:path*",
    "/comunicacion/:path*",
    "/capacitacion/:path*",
    "/beneficios/:path*",
    "/mesa-ayuda/:path*",
    "/firma/:path*",
    "/onboarding/:path*",
    "/cambiar-password",
    "/perfil/:path*",
  ],
};
