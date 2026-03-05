import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/auth-proxy"

export async function proxy(request: NextRequest) {
  const url = request.nextUrl
  const code = url.searchParams.get("code")

  if (code && (url.pathname === "/" || url.pathname === "/reset-password")) {
    const callbackUrl = new URL("/auth/callback", url.origin)
    callbackUrl.searchParams.set("code", code)
    callbackUrl.searchParams.set("redirect_to", "/reset-password")
    return NextResponse.redirect(callbackUrl)
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - static assets (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
