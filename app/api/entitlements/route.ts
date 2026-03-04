import { NextResponse, type NextRequest } from "next/server"
import { createRouteHandlerClient } from "@/lib/auth-route"
import { getSupabaseConfigOrNull } from "@/lib/supabase/env"

/**
 * GET /api/entitlements
 *
 * Returns Tea Course entitlements for the logged-in user (from DB, populated by webhook).
 * Use this on login to show "Start Tea Course" UI.
 */
export async function GET(request: NextRequest) {
  const config = getSupabaseConfigOrNull()
  if (!config) return NextResponse.json({ entitledCourseIds: [] })

  const res = NextResponse.json({})
  const supabase = createRouteHandlerClient(request, res, config)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ entitledCourseIds: [] })

  const { data } = await supabase
    .from("shopify_entitlements")
    .select("course_id")
    .eq("user_id", user.id)

  const entitledCourseIds = (data ?? []).map((r) => r.course_id)
  return NextResponse.json({ entitledCourseIds })
}
