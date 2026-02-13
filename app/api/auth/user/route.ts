import { NextResponse, type NextRequest } from "next/server"
import { createRouteHandlerClient } from "@/lib/auth-route"
import { getSupabaseConfigOrNull } from "@/lib/supabase/env"

export async function GET(request: NextRequest) {
  const config = getSupabaseConfigOrNull()
  if (!config) {
    return NextResponse.json({ user: null })
  }

  const response = NextResponse.json({ user: null })
  const supabase = createRouteHandlerClient(request, response, config)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ user: null })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single()

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email ?? null,
      displayName: profile?.display_name ?? null,
    },
  })
}
