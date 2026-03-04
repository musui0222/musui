import { NextResponse, type NextRequest } from "next/server"
import { createRouteHandlerClient } from "@/lib/auth-route"
import { getSupabaseConfigOrNull } from "@/lib/supabase/env"

type SessionItem = {
  laps: number[]
  memo?: string
  infusionNotes: Array<{ aroma?: string; body?: number; aftertaste?: string }>
  teaName?: string
  altitudeRange?: string
}

/** POST /api/archives/session — 티코스 세션 전체 저장 (여러 차를 하나의 아카이브로) */
export async function POST(request: NextRequest) {
  const config = getSupabaseConfigOrNull()
  if (!config) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
  }

  const res = NextResponse.json({})
  const supabase = createRouteHandlerClient(request, res, config)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  let body: { courseId: string; runId?: string; items: SessionItem[]; isPublic?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { courseId, runId, items, isPublic = false } = body
  if (!courseId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "courseId와 items가 필요합니다." }, { status: 400 })
  }

  if (items.length !== 4) {
    return NextResponse.json({ error: "items는 4개여야 합니다." }, { status: 400 })
  }

  let courseRunId: string | null = null
  if (runId) {
    const { data: run } = await supabase
      .from("course_runs")
      .select("id")
      .eq("id", runId)
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle()
    if (run) courseRunId = run.id
  }

  if (courseRunId) {
    const notesInsert = items.map((it, idx) => ({
      run_id: courseRunId,
      step_index: (idx + 1) as 1 | 2 | 3 | 4,
      laps: it.laps ?? [0, 0, 0],
      memo: it.memo ?? "",
      tea_name: it.teaName ?? null,
      altitude_range: it.altitudeRange ?? null,
      infusion_notes: it.infusionNotes ?? [],
    }))
    const { error: notesErr } = await supabase.from("notes").insert(notesInsert)
    if (notesErr) {
      console.error("[POST /api/archives/session] notes insert", notesErr)
      return NextResponse.json({ error: notesErr.message }, { status: 500 })
    }
  }

  const archiveId = `course-${courseId}-${Date.now()}`

  const { error: archiveError } = await supabase.from("archives").insert({
    id: archiveId,
    user_id: user.id,
    is_public: isPublic,
    course_run_id: courseRunId,
  })
  if (archiveError) {
    console.error("[POST /api/archives/session] archives insert", archiveError)
    return NextResponse.json({ error: archiveError.message }, { status: 500 })
  }

  const insertItems = items.map((it, idx) => ({
    archive_id: archiveId,
    item_index: idx,
    course_id: courseId,
    laps: it.laps ?? [0, 0, 0],
    mood: it.altitudeRange ?? "",
    memo: it.memo ?? "",
    tea_name: it.teaName ?? null,
    tea_type: null,
    origin: null,
    brand_or_purchase: null,
    photo_url: null,
    infusion_notes: it.infusionNotes ?? [],
  }))

  const { error: itemsError } = await supabase.from("archive_items").insert(insertItems)
  if (itemsError) {
    console.error("[POST /api/archives/session] archive_items insert", itemsError)
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({ id: archiveId })
}
