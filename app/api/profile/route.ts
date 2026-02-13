import { NextResponse, type NextRequest } from "next/server"
import { createRouteHandlerClient } from "@/lib/auth-route"
import { getSupabaseConfigOrNull } from "@/lib/supabase/env"

/** GET /api/profile — 현재 로그인 사용자 프로필 (display_name, email) */
export async function GET(request: NextRequest) {
  const config = getSupabaseConfigOrNull()
  if (!config) {
    return NextResponse.json({ profile: null }, { status: 503 })
  }

  const res = NextResponse.json({ profile: null })
  const supabase = createRouteHandlerClient(request, res, config)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ profile: null })
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, updated_at")
    .eq("id", user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ profile: null })
  }

  return NextResponse.json({
    profile: {
      id: profile.id,
      email: profile.email ?? null,
      displayName: profile.display_name ?? null,
      updatedAt: profile.updated_at,
    },
  })
}

/** PATCH /api/profile — 닉네임(display_name) 수정 */
export async function PATCH(request: NextRequest) {
  const config = getSupabaseConfigOrNull()
  if (!config) {
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  const res = NextResponse.json({ ok: false })
  const supabase = createRouteHandlerClient(request, res, config)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  let body: { display_name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const displayName = typeof body.display_name === "string" ? body.display_name.trim() : null
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
