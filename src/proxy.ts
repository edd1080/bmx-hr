import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

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

  // Rate Limiting por IP (10 peticiones de login por minuto; 120 peticiones generales por minuto)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "127.0.0.1";
  
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    const rl = checkRateLimit(`login_${ip}`, 60, 60000);
    if (!rl.success) {
      return rateLimitResponse(rl.reset);
    }
  } else {
    const rl = checkRateLimit(`general_${ip}`, 120, 60000);
    if (!rl.success) {
      return rateLimitResponse(rl.reset);
    }
  }

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
