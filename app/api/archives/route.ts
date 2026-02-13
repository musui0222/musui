import { NextResponse, type NextRequest } from "next/server"
import { createRouteHandlerClient } from "@/lib/auth-route"
import { getSupabaseConfigOrNull } from "@/lib/supabase/env"

/** 목록용: 썸네일(photo_url) 포함, infusion_notes는 상세에서만 */
function toSessionArchiveList(row: {
  id: string
  created_at: string
  is_public: boolean
  archive_items: Array<{
    item_index: number
    course_id: string
    laps: number[]
    mood: string
    memo: string
    photo_url: string | null
    tea_name: string | null
    tea_type: string | null
    origin: string | null
    brand_or_purchase: string | null
  }>
}) {
  const sorted = [...(row.archive_items ?? [])].sort((a, b) => (a.item_index ?? 0) - (b.item_index ?? 0))
  return {
    id: row.id,
    createdAt: row.created_at,
    isPublic: row.is_public,
    items: sorted.map((it) => ({
      courseId: it.course_id,
      laps: it.laps ?? [0, 0, 0],
      mood: it.mood ?? "",
      memo: it.memo ?? "",
      photoDataUrl: it.photo_url ?? undefined,
      teaName: it.tea_name ?? undefined,
      teaType: it.tea_type ?? undefined,
      origin: it.origin ?? undefined,
      brandOrPurchase: it.brand_or_purchase ?? undefined,
      infusionNotes: [] as Array<{ aroma?: string; body?: number; aftertaste?: string }>,
    })),
  }
}

/** GET /api/archives — 내 아카이브 목록 */
export async function GET(request: NextRequest) {
  const config = getSupabaseConfigOrNull()
  if (!config) {
    return NextResponse.json({ archives: [] })
  }

  const res = NextResponse.json({ archives: [] })
  const supabase = createRouteHandlerClient(request, res, config)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ archives: [] })
  }

  const { data: rows, error } = await supabase
    .from("archives")
    .select(
      `
      id,
      created_at,
      is_public,
      archive_items (
        item_index,
        course_id,
        laps,
        mood,
        memo,
        photo_url,
        tea_name,
        tea_type,
        origin,
        brand_or_purchase
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[GET /api/archives]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const archives = (rows ?? []).map(toSessionArchiveList)
  return NextResponse.json({ archives })
}

/** POST /api/archives — 차 기록 저장 (로그인 필요) */
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
    teaName: string
    teaType: string
    origin?: string
    brandOrPurchase?: string
    laps: number[]
    infusionNotes: Array<{ aroma?: string; body?: number; aftertaste?: string }>
    photoDataUrl?: string
    isPublic: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const archiveId = `manual-${Date.now()}`
  const { error: archiveError } = await supabase.from("archives").insert({
    id: archiveId,
    user_id: user.id,
    is_public: body.isPublic ?? false,
  })
  if (archiveError) {
    console.error("[POST /api/archives] archives insert", archiveError)
    return NextResponse.json({ error: archiveError.message }, { status: 500 })
  }

  const { error: itemError } = await supabase.from("archive_items").insert({
    archive_id: archiveId,
    item_index: 0,
    course_id: "manual",
    laps: body.laps ?? [0, 0, 0],
    mood: body.teaType ?? "기타",
    memo: body.teaName?.trim() || "이름 없음",
    tea_name: body.teaName?.trim() || "이름 없음",
    tea_type: body.teaType || "기타",
    origin: body.origin?.trim() || null,
    brand_or_purchase: body.brandOrPurchase?.trim() || null,
    photo_url: body.photoDataUrl ?? null,
    infusion_notes: body.infusionNotes ?? [],
  })
  if (itemError) {
    console.error("[POST /api/archives] archive_items insert", itemError)
    return NextResponse.json({ error: itemError.message }, { status: 500 })
  }

  return NextResponse.json({ id: archiveId })
}
