import { NextResponse, type NextRequest } from "next/server"
import { createRouteHandlerClient } from "@/lib/auth-route"
import { getSupabaseConfigOrNull } from "@/lib/supabase/env"

/**
 * GET /api/me/entitlements
 *
 * Returns Tea Course entitlements for the logged-in user.
 * - First query by user_id
 * - If none, query by email (auth.users.email)
 * - If found by email, link those rows to user_id (update)
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

  // Development bypass: full Tea Course access when MUSUI_DEV_CODE=true
  const devBypass =
    process.env.MUSUI_DEV_CODE === "true" && process.env.NODE_ENV === "development"
  if (devBypass) {
    return NextResponse.json({ entitledCourseIds: ["session-1"] })
  }

  let { data } = await supabase
    .from("shopify_entitlements")
    .select("course_id")
    .eq("user_id", user.id)

  if ((!data || data.length === 0) && user.email) {
    const emailNorm = user.email.trim().toLowerCase()
    const { data: byEmail } = await supabase
      .from("shopify_entitlements")
      .select("id, course_id")
      .ilike("email", emailNorm)
      .is("user_id", null)

    if (byEmail && byEmail.length > 0) {
      await supabase
        .from("shopify_entitlements")
        .update({ user_id: user.id })
        .ilike("email", emailNorm)
        .is("user_id", null)
      data = byEmail
    }
  }

  const entitledCourseIds = [...new Set((data ?? []).map((r) => r.course_id))]
  return NextResponse.json({ entitledCourseIds })
}
