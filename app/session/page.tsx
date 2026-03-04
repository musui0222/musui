import { SessionContent } from "./SessionContent"
import { TeaCourseSessionContent } from "./TeaCourseSessionContent"
import { getTeaCourseSessionById } from "@/lib/teaCourseData"
import { getCourseComposition } from "@/lib/courseComposition"
import { resolveInternalCourseId } from "@/lib/courseRegistry"

type Props = { searchParams: Promise<{ course?: string; run?: string }> }

export default async function SessionPage({ searchParams }: Props) {
  const params = await searchParams
  const courseId = params.course ?? null
  const runId = params.run ?? null
  const internalId = resolveInternalCourseId(courseId) ?? courseId

  const teaCourse = getTeaCourseSessionById(internalId)
  if (teaCourse && internalId) {
    const composition = await getCourseComposition(internalId)
    const teas = composition ?? teaCourse.teas.slice(0, 4)
    return (
      <TeaCourseSessionContent
        courseId={teaCourse.id}
        courseTitle={teaCourse.title}
        courseOneLiner={teaCourse.oneLiner}
        courseTotalMinutes={teaCourse.totalMinutes}
        courseConcept={teaCourse.concept}
        runId={runId}
        teas={teas}
      />
    )
  }

  return <SessionContent initialCourseId={courseId} />
}
