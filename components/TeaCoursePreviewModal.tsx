"use client"

import * as React from "react"
import { getCourseById } from "@/lib/courseRegistry"
import TeaCourseCodeBlock from "./TeaCourseCodeBlock"

const BOLD_WORDS = ["백호은침", "봉황단총", "동방미인", "센차"]

function renderDescription(text: string) {
  let result = text
  for (const word of BOLD_WORDS) {
    result = result.replace(new RegExp(word, "g"), `__BOLD__${word}__BOLD__`)
  }
  const parts = result.split(/__BOLD__/)
  return parts.map((part, i) =>
    BOLD_WORDS.includes(part) ? (
      <strong key={i}>{part}</strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  )
}

type Props = {
  courseId: string
  codeFromUrl?: string
  onClose: () => void
}

export default function TeaCoursePreviewModal({ courseId, codeFromUrl, onClose }: Props) {
  const course = getCourseById(courseId)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEscape)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === ref.current) onClose()
  }

  if (!course) return null

  const desc = course.previewDescription ?? course.concept

  return (
    <div
      ref={ref}
      className="tc-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tc-modal-title"
    >
      <div className="tc-modal">
        <div className="tc-modal-wrapper">
          <button
            type="button"
            className="tc-modal-close"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
          {course.poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.poster}
              alt=""
              className="tc-modal-poster"
            />
          )}
          <div className="tc-modal-header">
            <h2 id="tc-modal-title" className="tc-modal-name">
              {course.title}
            </h2>
            <p className="tc-modal-meta">세션: {course.totalMinutes}분</p>
          </div>
          <div className="tc-modal-desc">
            {desc.split("\n\n").map((para, i) => (
              <p key={i}>{renderDescription(para)}</p>
            ))}
          </div>
          <div className="tc-modal-divider" />
          <TeaCourseCodeBlock courseId={courseId} codeFromUrl={codeFromUrl} />
        </div>
      </div>
    </div>
  )
}
