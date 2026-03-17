import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

const protectedPaths = ["/app"];
const authPaths = ["/login", "/register"];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  if (isProtectedPath || isAuthPath) {
    const session = await auth();

    if (isProtectedPath && !session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check subscription status for app routes
    if (isProtectedPath && session) {
      const subStatus = session.user.subStatus;
      if (subStatus === "CANCELED" && !pathname.startsWith("/app/configuracion/facturacion")) {
        return NextResponse.redirect(new URL("/app/configuracion/facturacion", req.url));
      }
    }

    // Redirect logged-in users away from auth pages
    if (isAuthPath && session) {
      return NextResponse.redirect(new URL("/app", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
