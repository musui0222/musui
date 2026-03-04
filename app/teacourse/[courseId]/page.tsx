import { redirect } from "next/navigation"
import Header from "@/components/header"
import TeaCoursePageContent from "./TeaCoursePageContent"
import { getCourseById } from "@/lib/courseRegistry"

/**
 * Tea Course page: /teacourse/[courseId]
 * Renders gate for registered courses; redirects unknown courseIds.
 */
export default async function TeaCourseGatePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId?: string }>
  searchParams: Promise<{ code?: string }>
}) {
  const { courseId } = await params
  const { code } = await searchParams

  const course = getCourseById(courseId ?? null)
  if (!course) {
    const target = code ? `/sessions?code=${encodeURIComponent(code)}` : "/sessions"
    redirect(target)
  }

  return (
    <div className="min-h-dvh bg-white text-black">
      <Header />
      <main>
        <TeaCoursePageContent courseId={course.id} />
      </main>
    </div>
  )
}
