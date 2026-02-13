import { SessionContent } from "./SessionContent"

type Props = { searchParams: Promise<{ course?: string }> }

export default async function SessionPage({ searchParams }: Props) {
  const params = await searchParams
  const courseId = params.course ?? null
  return <SessionContent initialCourseId={courseId} />
}
