import { NextResponse, type NextRequest } from "next/server"
import { createRouteHandlerClient } from "@/lib/auth-route"

export async function POST(request: NextRequest) {
  const redirectUrl = new URL("/", request.url)
  const response = NextResponse.redirect(redirectUrl)
  const supabase = createRouteHandlerClient(request, response)
  await supabase.auth.signOut()
  return response
}
