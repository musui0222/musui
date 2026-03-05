import { NextResponse, type NextRequest } from "next/server"
import { createRouteHandlerClient } from "@/lib/auth-route"
import { getSupabaseConfigOrNull } from "@/lib/supabase/env"

type CourseRecord = {
  waterTempC?: number
  steepingTimeSec?: number
  body?: number
  aroma?: number
  aftertaste?: string
}

/** POST /api/archives/intro — 고도 인트로 코스 기록 저장 (1 아카이브, 1 아이템) */
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

  let body: {
    teaCourseName: string
    courseRecords: CourseRecord[]
    photoDataUrl?: string
    isPublic?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { teaCourseName, courseRecords, photoDataUrl, isPublic = false } = body
  if (!teaCourseName || !Array.isArray(courseRecords)) {
    return NextResponse.json({ error: "teaCourseName과 courseRecords가 필요합니다." }, { status: 400 })
  }

  const archiveId = `intro-${Date.now()}`
  const memo = JSON.stringify({
    type: "intro",
    teaCourseName,
    courseRecords,
  })

  const { error: archiveError } = await supabase.from("archives").insert({
    id: archiveId,
    user_id: user.id,
    is_public: isPublic,
  })
  if (archiveError) {
    console.error("[POST /api/archives/intro] archives insert", archiveError)
    return NextResponse.json({ error: archiveError.message }, { status: 500 })
  }

  const { error: itemError } = await supabase.from("archive_items").insert({
    archive_id: archiveId,
    item_index: 0,
    course_id: "altitude-intro",
    laps: courseRecords[0]?.steepingTimeSec != null ? [courseRecords[0].steepingTimeSec] : [0, 0, 0],
    mood: teaCourseName,
    memo,
    tea_name: teaCourseName,
    tea_type: null,
    origin: null,
    brand_or_purchase: null,
    photo_url: photoDataUrl ?? null,
    infusion_notes: courseRecords,
  })
  if (itemError) {
    console.error("[POST /api/archives/intro] archive_items insert", itemError)
    return NextResponse.json({ error: itemError.message }, { status: 500 })
  }

  return NextResponse.json({ id: archiveId })
}
