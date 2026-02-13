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

/** GET /api/archives/public — 공개 아카이브 목록 (커뮤니티용) */
export async function GET(request: NextRequest) {
  const config = getSupabaseConfigOrNull()
  if (!config) {
    return NextResponse.json({ archives: [] })
  }

  const res = NextResponse.json({ archives: [] })
  const supabase = createRouteHandlerClient(request, res, config)

  const { data: rows, error } = await supabase
    .from("archives")
    .select(
      `
      id,
      user_id,
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
    .eq("is_public", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[GET /api/archives/public]", error)
    return NextResponse.json({ archives: [] })
  }

  const userIds = [...new Set((rows ?? []).map((r: { user_id?: string }) => r.user_id).filter(Boolean))] as string[]
  let displayNames: Record<string, string | null> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds)
    for (const p of profiles ?? []) {
      displayNames[p.id] = p.display_name ?? null
    }
  }

  const archives = (rows ?? []).map((row: { user_id?: string } & Parameters<typeof toSessionArchive>[0]) => {
    const session = toSessionArchive(row)
    return {
      ...session,
      authorDisplayName: row.user_id ? (displayNames[row.user_id] ?? null) : null,
    }
  })
  return NextResponse.json({ archives })
}
