import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canAccessRoute } from "@/lib/permissions";
import { hasSupabasePublicEnv, supabaseAnonKey, supabaseUrl } from "@/lib/env";

const publicRoutes = ["/login", "/forgot-password", "/reset-password", "/403"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!hasSupabasePublicEnv()) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (userId && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (userId && !isPublic) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, clinic_id, active")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile && pathname !== "/setup") {
      const url = request.nextUrl.clone();
      url.pathname = "/setup";
      return NextResponse.redirect(url);
    }

    if (profile && !canAccessRoute(profile.role, pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/403";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
