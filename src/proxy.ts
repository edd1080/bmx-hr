import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/equipo",
  "/admin",
  "/comunicacion",
  "/capacitacion",
  "/venta-empleados",
  "/beneficios",
  "/mesa-ayuda",
  "/firma",
  "/onboarding",
  "/cambiar-password",
];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  // Si no hay variables de Supabase configuradas aun en .env, permite el paso controlado
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("tu-proyecto")) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const mustChangePassword = user?.user_metadata?.mustChangePassword === true;

  if (user && mustChangePassword && pathname !== "/cambiar-password") {
    return NextResponse.redirect(new URL("/cambiar-password", request.url));
  }

  if (user && pathname === "/cambiar-password" && !mustChangePassword) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export default proxy;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/equipo/:path*",
    "/admin/:path*",
    "/comunicacion/:path*",
    "/capacitacion/:path*",
    "/venta-empleados/:path*",
    "/beneficios/:path*",
    "/mesa-ayuda/:path*",
    "/firma/:path*",
    "/onboarding/:path*",
    "/cambiar-password",
  ],
};
