import { NextResponse, type NextRequest } from "next/server"
import { createRouteHandlerClient } from "@/lib/auth-route"
import { getSupabaseConfigOrNull } from "@/lib/supabase/env"

export async function POST(request: NextRequest) {
  const redirectUrl = new URL("/", request.url)
  const response = NextResponse.redirect(redirectUrl)

  const config = getSupabaseConfigOrNull()
  if (!config) {
    return response
  }

  const supabase = createRouteHandlerClient(request, response, config)
  await supabase.auth.signOut()
  return response
}
