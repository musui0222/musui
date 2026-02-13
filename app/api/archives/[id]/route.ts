import { NextResponse, type NextRequest } from "next/server"
import { createRouteHandlerClient } from "@/lib/auth-route"
import { getSupabaseConfigOrNull } from "@/lib/supabase/env"

function toSessionArchive(row: {
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
    infusion_notes: unknown
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
      infusionNotes: Array.isArray(it.infusion_notes) ? it.infusion_notes : [],
    })),
  }
}

/** GET /api/archives/[id] — 아카이브 1건 (본인 것 또는 공개) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const config = getSupabaseConfigOrNull()
  if (!config) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 })
  }
  const { id } = await params
  const res = NextResponse.json({})
  const supabase = createRouteHandlerClient(request, res, config)

  const { data: row, error } = await supabase
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
        brand_or_purchase,
        infusion_notes
      )
    `
    )
    .eq("id", id)
    .single()

  if (error || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(toSessionArchive(row))
}

/** PATCH /api/archives/[id] — 공개 여부 변경 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const config = getSupabaseConfigOrNull()
  if (!config) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
  }

  const { id } = await params
  const res = NextResponse.json({})
  const supabase = createRouteHandlerClient(request, res, config)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  let body: { isPublic?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { error } = await supabase
    .from("archives")
    .update({ is_public: body.isPublic ?? false })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("[PATCH /api/archives/:id]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

/** DELETE /api/archives/[id] — 아카이브 삭제 (본인 것만) */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const config = getSupabaseConfigOrNull()
  if (!config) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
  }

  const { id } = await params
  const res = NextResponse.json({})
  const supabase = createRouteHandlerClient(request, res, config)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const { error } = await supabase
    .from("archives")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("[DELETE /api/archives/:id]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
