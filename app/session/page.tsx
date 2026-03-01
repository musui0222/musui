import { SessionContent } from "./SessionContent"
import { TeaCourseSessionContent } from "./TeaCourseSessionContent"
import { getTeaCourseSessionById } from "@/lib/teaCourseData"

type Props = { searchParams: Promise<{ course?: string }> }

export default async function SessionPage({ searchParams }: Props) {
  const params = await searchParams
  const courseId = params.course ?? null

  const teaCourse = getTeaCourseSessionById(courseId)
  if (teaCourse) {
    return <TeaCourseSessionContent courseId={teaCourse.id} />
  }

  return <SessionContent initialCourseId={courseId} />
}
