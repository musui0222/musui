"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { getCourseById, getListCourseIds } from "@/lib/courseRegistry"
import TeaCoursePreviewModal from "./TeaCoursePreviewModal"

export default function TeaCourseList() {
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get("code")?.trim()?.toUpperCase() ?? ""

  const [previewCourseId, setPreviewCourseId] = React.useState<string | null>(null)

  const courseIds = getListCourseIds()

  return (
    <section>
      <h1 className="tc-title font-manrope">TEA COURSE</h1>
      <div className="tc-list">
        {courseIds.map((id) => {
          const course = getCourseById(id)
          if (!course) return null
          return (
            <div
              key={id}
              className="tc-card"
              onClick={() => setPreviewCourseId(id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setPreviewCourseId(id)
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`${course.title} 상세 보기`}
            >
              <div className="tc-thumbnail">
                {course.poster && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.poster} alt="" />
                )}
              </div>
              <div className="tc-card-meta">
                <p className="tc-card-name">{course.title}</p>
                <p className="tc-card-time">{course.totalMinutes}분</p>
                <p className="tc-card-teas">4종의 차</p>
              </div>
            </div>
          )
        })}
      </div>

      {previewCourseId && (
        <TeaCoursePreviewModal
          courseId={previewCourseId}
          codeFromUrl={codeFromUrl}
          onClose={() => setPreviewCourseId(null)}
        />
      )}
    </section>
  )
}
