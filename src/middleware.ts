import { authConfig } from "@/lib/auth.config";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/verify", "/invite", "/onboarding", "/debug-login"];

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron");

  if (isPublic) return NextResponse.next();

  const session = req.auth as { user?: { id?: string } } | null;
  if (!session?.user?.id) {
    const loginPath =
      process.env["NODE_ENV"] === "development" ? "/debug-login" : "/login";
    return NextResponse.redirect(
      new URL(`${loginPath}?callbackUrl=${encodeURIComponent(pathname)}`, req.url),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
