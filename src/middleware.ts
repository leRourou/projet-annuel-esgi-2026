import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/verify", "/invite", "/onboarding"];

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron");

  if (isPublic) return NextResponse.next();

  const session = req.auth as { user?: { id?: string } } | null;
  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
