import { redirect } from "next/navigation"
import Header from "@/components/header"
import TeaCourseIntroContent from "./TeaCourseIntroContent"
import { getCourseById } from "@/lib/courseRegistry"

export default async function TeaCourseIntroPage({
  params,
}: {
  params: Promise<{ courseId?: string }>
}) {
  const { courseId } = await params

  const course = getCourseById(courseId ?? null)
  if (!course) {
    redirect("/sessions")
  }

  return (
    <div className="min-h-dvh bg-white text-black">
      <Header />
      <main>
        <TeaCourseIntroContent courseId={course.id} internalId={course.internalId} />
      </main>
    </div>
  )
}
