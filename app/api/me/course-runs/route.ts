import { NextResponse, type NextRequest } from "next/server"
import { createRouteHandlerClient } from "@/lib/auth-route"
import { getSupabaseConfigOrNull } from "@/lib/supabase/env"
import { resolveInternalCourseId } from "@/lib/courseRegistry"

/**
 * GET /api/me/course-runs?courseId=session-1
 *
 * Returns runs for the user and course.
 * Returns: { runs: [{ id, created_at }] }
 */
export async function GET(request: NextRequest) {
  const config = getSupabaseConfigOrNull()
  if (!config) return NextResponse.json({ runs: [] })

  const res = NextResponse.json({})
  const supabase = createRouteHandlerClient(request, res, config)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ runs: [] })

  const courseId = request.nextUrl.searchParams.get("courseId")?.trim()
  if (!courseId) return NextResponse.json({ runs: [] })

  const internalId = resolveInternalCourseId(courseId) ?? courseId

  const { data } = await supabase
    .from("course_runs")
    .select("id, created_at")
    .eq("user_id", user.id)
    .eq("course_id", internalId)
    .order("created_at", { ascending: false })

  return NextResponse.json({ runs: data ?? [] })
}

/**
 * POST /api/me/course-runs
 *
 * Creates a new course run for Start/Restart.
 * Requires: user logged in, entitled to the course.
 * Returns: { runId: string }
 */
export async function POST(request: NextRequest) {
  const config = getSupabaseConfigOrNull()
  if (!config) return NextResponse.json({ error: "Not configured" }, { status: 503 })

  const res = NextResponse.json({})
  const supabase = createRouteHandlerClient(request, res, config)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })

  let body: { courseId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const courseId = body.courseId?.trim()
  if (!courseId) return NextResponse.json({ error: "courseId가 필요합니다." }, { status: 400 })

  const internalId = resolveInternalCourseId(courseId) ?? courseId

  // Development bypass: allow session-1 when MUSUI_DEV_CODE=true
  const devBypass =
    process.env.MUSUI_DEV_CODE === "true" &&
    process.env.NODE_ENV === "development" &&
    (courseId === "session-1" || internalId === "session-1")
  if (devBypass) {
    const { data: run, error } = await supabase
      .from("course_runs")
      .insert({ user_id: user.id, course_id: internalId })
      .select("id")
      .single()
    if (error) {
      console.error("[POST /api/me/course-runs]", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ runId: run.id })
  }

  // Check entitlement (user_id or email) - accept both courseId and internalId
  const courseIds = [...new Set([courseId, internalId])]
  const { data: byUser } = await supabase
    .from("shopify_entitlements")
    .select("id")
    .eq("user_id", user.id)
    .in("course_id", courseIds)
    .maybeSingle()

  let entitled = !!byUser
  if (!entitled && user.email) {
    const emailNorm = user.email.trim().toLowerCase()
    const { data: byEmail } = await supabase
      .from("shopify_entitlements")
      .select("id")
      .ilike("email", emailNorm)
      .in("course_id", courseIds)
      .maybeSingle()
    entitled = !!byEmail
  }

  if (!entitled) return NextResponse.json({ error: "이 코스에 대한 권한이 없습니다." }, { status: 403 })

  const { data: run, error } = await supabase
    .from("course_runs")
    .insert({ user_id: user.id, course_id: internalId })
    .select("id")
    .single()

  if (error) {
    console.error("[POST /api/me/course-runs]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ runId: run.id })
}
