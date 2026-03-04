import { redirect } from "next/navigation"
import { resolveCourseIdFromCode } from "@/lib/courseRegistry"

/**
 * QR entry: /start?code=X → /teacourse/[courseId]?code=X
 * Example: /start?code=ALTITUDE → /teacourse/altitude?code=ALTITUDE
 */
export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  const courseId = resolveCourseIdFromCode(code ?? null) ?? "altitude"
  const target = code ? `/teacourse/${courseId}?code=${encodeURIComponent(code)}` : `/teacourse/${courseId}`
  redirect(target)
}
