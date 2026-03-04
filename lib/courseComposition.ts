import { createClient } from "@supabase/supabase-js"
import { getSupabaseConfigOrNull } from "./supabase/env"

export type TeaInCourse = {
  id: string
  name: string
  origin: string
  tastingNote: string
  meaningInCourse: string
  recommendedTemp: string
  recommendedTime: string
  steepingGuide: string
  altitudeRange?: string
  zoneName?: string
  imageSrc?: string
  musuiTip?: string
}

/**
 * Fetches course composition from DB (course_items + teas).
 * Returns 4 teas for step_index 1..4, or null if not configured / no data.
 */
export async function getCourseComposition(courseId: string): Promise<TeaInCourse[] | null> {
  const config = getSupabaseConfigOrNull()
  if (!config) return null

  const supabase = createClient(config.url, config.anonKey)

  const { data: items, error } = await supabase
    .from("course_items")
    .select("step_index, tea_id")
    .eq("course_id", courseId)
    .order("step_index", { ascending: true })

  if (error || !items || items.length !== 4) return null

  const teaIds = items.map((r) => r.tea_id)
  const { data: teaRows, error: teasErr } = await supabase
    .from("teas")
    .select("id, name, origin, tasting_note, meaning_in_course, recommended_temp, recommended_time, steeping_guide, altitude_range, zone_name, image_src, musui_tip")
    .in("id", teaIds)

  if (teasErr || !teaRows || teaRows.length !== 4) return null

  const teaMap = Object.fromEntries(teaRows.map((t) => [t.id, t]))

  const teas: TeaInCourse[] = items
    .map((r) => teaMap[r.tea_id])
    .filter(Boolean)
    .map((t) => {
      const row = t as Record<string, unknown>
      return {
        id: String(row.id ?? ""),
        name: String(row.name ?? ""),
        origin: String(row.origin ?? ""),
        tastingNote: String(row.tasting_note ?? ""),
        meaningInCourse: String(row.meaning_in_course ?? ""),
        recommendedTemp: String(row.recommended_temp ?? ""),
        recommendedTime: String(row.recommended_time ?? ""),
        steepingGuide: String(row.steeping_guide ?? ""),
        altitudeRange: row.altitude_range != null ? String(row.altitude_range) : undefined,
        zoneName: row.zone_name != null ? String(row.zone_name) : undefined,
        imageSrc: row.image_src != null ? String(row.image_src) : undefined,
        musuiTip: row.musui_tip != null ? String(row.musui_tip) : undefined,
      }
    })

  return teas.length === 4 ? teas : null
}
