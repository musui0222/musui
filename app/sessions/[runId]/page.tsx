import { redirect } from "next/navigation"
import { getPreferredCourseId } from "@/lib/courseRegistry"

/**
 * /sessions/[runId] → session content
 * Redirects to /session?course=[courseId]&run=runId (clean URL: altitude)
 */
export default async function SessionRunPage({
  params,
}: {
  params: Promise<{ runId: string }>
}) {
  const { runId } = await params
  const courseId = getPreferredCourseId("session-1") ?? "session-1"
  redirect(`/session?course=${encodeURIComponent(courseId)}&run=${encodeURIComponent(runId)}`)
}
