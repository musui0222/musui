import { NextResponse, type NextRequest } from "next/server"
import { createRouteHandlerClient } from "@/lib/auth-route"

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ user: null })
  const supabase = createRouteHandlerClient(request, response)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return NextResponse.json({
    user: user ? { id: user.id, email: user.email ?? null } : null,
  })
}
