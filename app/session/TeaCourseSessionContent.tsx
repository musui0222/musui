"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import { TeaRecordBlock } from "@/components/TeaRecordBlock"
import {
  getTeaCourseSessionById,
  type TeaInCourse,
} from "@/lib/teaCourseData"
import { addCourseSessionArchive, type InfusionNote } from "@/lib/musuiStore"
import Link from "next/link"

type TeaRecord = {
  laps: number[]
  infusionNote: InfusionNote
  altitudeRange?: string
}

const btnClass =
  "w-full border border-black bg-black py-3 text-[13px] font-medium text-white hover:bg-black/90 disabled:opacity-60"

const btnDelicate =
  "inline-flex items-center gap-1.5 py-2 text-[12px] font-medium text-black/80 hover:text-black transition-colors"

const ORDINALS_EN = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth"]

function formatAltitudeForTitle(range: string): string {
  return range.replace(/\s/g, "").replace(/m/g, "M")
}

function TeaPageContent({
  tea,
  teaIndex,
  totalTeas,
  rec,
  recordingStarted,
  onStartRecording,
  onUpdateRecord,
  onNext,
}: {
  tea: TeaInCourse
  teaIndex: number
  totalTeas: number
  rec: TeaRecord
  recordingStarted: boolean
  onStartRecording: () => void
  onUpdateRecord: (patch: Partial<TeaRecord>) => void
  onNext: () => void
}) {
  return (
    <main className="mx-auto max-w-[480px] px-4 py-6">
      <p className="mb-4 text-[11px] text-black/50">
        {teaIndex + 1} / {totalTeas}
      </p>
      {tea.zoneName && tea.altitudeRange && (
        <div className="mb-3">
          <p className="font-noto-sans text-[14px] font-semibold tracking-tight text-black">
            {ORDINALS_EN[teaIndex] ?? `${teaIndex + 1}th`} Course
          </p>
          <p className="font-noto-sans mt-0.5 text-[12px] text-black/85">
            {tea.zoneName} {formatAltitudeForTitle(tea.altitudeRange)}
          </p>
        </div>
      )}
      {!tea.zoneName && tea.altitudeRange && (
        <p className="font-noto-sans mb-2 text-[15px] font-semibold tracking-tight text-black">
          {tea.altitudeRange}
        </p>
      )}
      <h2 className="font-noto-sans mb-1 text-[20px] font-semibold text-black">
        {tea.name}
      </h2>
      <p className="mb-4 text-[12px] text-black/60">{tea.origin}</p>
      {tea.imageSrc && (
        <div className="mb-4 overflow-hidden border border-black/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tea.imageSrc}
            alt=""
            className="block w-full object-cover object-center"
            style={{ maxHeight: 200 }}
          />
        </div>
      )}
      <p className="mb-4 text-[12px] leading-relaxed text-black/75">
        {tea.tastingNote}
      </p>
      <div className="mb-4 flex flex-wrap gap-3 text-[11px] text-black/70">
        <span>권장 온도: {tea.recommendedTemp}</span>
        <span>권장 우림: {tea.recommendedTime}</span>
        <span>우림 횟수: {tea.steepingGuide}</span>
      </div>

      {tea.musuiTip && (
        <div className="mb-6 border border-black/12 p-4">
          <p className="mb-3 text-[11px] font-semibold text-black">
            ▢ Musui Tip
          </p>
          <div className="space-y-4 text-[11px] leading-relaxed text-black/80">
            {tea.musuiTip
              ?.split(/(?=■)/)
              .filter((s) => s.trim())
              .map((block, i) => (
                <p key={i} className="whitespace-pre-line">
                  {block.trim()}
                </p>
              ))}
          </div>
        </div>
      )}

      {!recordingStarted ? (
        <button
          type="button"
          onClick={onStartRecording}
          className={`${btnDelicate} mt-2`}
        >
          우림 시작
          <span className="text-[10px]">→</span>
        </button>
      ) : (
        <>
          <TeaRecordBlock
            laps={rec.laps}
            infusionNote={rec.infusionNote}
            onLapsChange={(laps) => onUpdateRecord({ laps })}
            onInfusionNoteChange={(infusionNote) =>
              onUpdateRecord({ infusionNote })
            }
          />
          <button
            type="button"
            onClick={onNext}
            className={`${btnDelicate} mt-6`}
          >
            {teaIndex < totalTeas - 1
              ? "다음 코스로 넘어가기"
              : "기록 확인하고 세션 완료하기"}
            <span className="text-[10px]">→</span>
          </button>
        </>
      )}
    </main>
  )
}

export function TeaCourseSessionContent({ courseId }: { courseId: string }) {
  const router = useRouter()
  const course = getTeaCourseSessionById(courseId)

  const [step, setStep] = React.useState(0)
  const [teaRecordingStarted, setTeaRecordingStarted] = React.useState<
    boolean[]
  >(() => (course ? course.teas.map(() => false) : []))
  const [records, setRecords] = React.useState<TeaRecord[]>(() =>
    course
      ? course.teas.map((t) => ({
          laps: [0, 0, 0],
          infusionNote: {},
          altitudeRange: t.altitudeRange,
        }))
      : []
  )
  const [saving, setSaving] = React.useState(false)
  const [user, setUser] = React.useState<{ id: string } | null>(null)

  React.useEffect(() => {
    fetch("/api/auth/user")
      .then((r) => r.json())
      .then((d: { user: { id: string } | null }) => setUser(d.user))
  }, [])

  if (!course) {
    return (
      <div className="min-h-dvh bg-white text-black">
        <Header />
        <main className="mx-auto max-w-[480px] px-4 py-8">
          <p className="text-[13px] text-black/70">코스를 찾을 수 없습니다.</p>
          <Link
            href="/sessions"
            className="mt-4 inline-block text-[13px] underline"
          >
            Sessions로 돌아가기
          </Link>
        </main>
      </div>
    )
  }

  const updateRecord = (index: number, patch: Partial<TeaRecord>) => {
    setRecords((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const startTeaRecording = (index: number) => {
    setTeaRecordingStarted((prev) => {
      const next = [...prev]
      next[index] = true
      return next
    })
  }

  const handleComplete = async () => {
    setSaving(true)
    const payload = {
      courseId: course.id,
      items: records.map((r, i) => ({
        teaName: course.teas[i]?.name,
        laps: r.laps,
        memo: "",
        infusionNotes: [r.infusionNote],
        altitudeRange: r.altitudeRange ?? course.teas[i]?.altitudeRange,
      })),
      isPublic: false,
    }

    if (user) {
      try {
        const res = await fetch("/api/archives/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          router.push("/archive")
          return
        }
      } catch {
        addCourseSessionArchive(payload)
      }
    } else {
      addCourseSessionArchive(payload)
    }
    router.push("/archive")
    setSaving(false)
  }

  const summaryStep = 1 + course.teas.length

  // 0: 코스 설명
  if (step === 0) {
    return (
      <div className="min-h-dvh bg-white text-black">
        <Header />
        <main className="mx-auto max-w-[480px] px-4 py-8">
          <h1 className="font-noto-sans mb-1 text-[18px] font-semibold text-black">
            {course.title}
          </h1>
          <p className="mb-2 text-[13px] text-black/80">{course.oneLiner}</p>
          <p className="mb-4 text-[12px] text-black/55">
            전체 소요 시간 약 {course.totalMinutes}분
          </p>
          <p className="mb-8 text-[12px] leading-relaxed text-black/70">
            {course.concept}
          </p>
          <button
            type="button"
            onClick={() => setStep(1)}
            className={btnClass}
          >
            다음으로 넘어가기
          </button>
        </main>
      </div>
    )
  }

  // 1 ~ N: 각 차 페이지 (코스당 한 페이지)
  if (step >= 1 && step <= course.teas.length) {
    const teaIndex = step - 1
    const tea = course.teas[teaIndex]
    const rec = records[teaIndex] ?? {
      laps: [0, 0, 0],
      infusionNote: {},
      altitudeRange: tea.altitudeRange,
    }
    const recordingStarted = teaRecordingStarted[teaIndex]

    return (
      <div className="min-h-dvh bg-white text-black">
        <Header />
        <TeaPageContent
          tea={tea}
          teaIndex={teaIndex}
          totalTeas={course.teas.length}
          rec={rec}
          recordingStarted={recordingStarted}
          onStartRecording={() => startTeaRecording(teaIndex)}
          onUpdateRecord={(patch) => updateRecord(teaIndex, patch)}
          onNext={() => setStep(step + 1)}
        />
      </div>
    )
  }

  // 마지막: 기록 요약 + 세션 완료
  if (step === summaryStep) {
    return (
      <div className="min-h-dvh bg-white text-black">
        <Header />
        <main className="mx-auto max-w-[480px] px-4 py-6 pb-12">
          <h2 className="font-noto-sans mb-4 text-[16px] font-semibold text-black">
            기록 요약
          </h2>
          <div className="mb-8 space-y-4">
            {course.teas.map((tea, i) => {
              const rec = records[i] ?? { laps: [0, 0, 0], infusionNote: {} }
              const note = rec.infusionNote
              const altRange = rec.altitudeRange ?? tea.altitudeRange
              return (
                <div key={tea.id} className="border border-black/12 p-4">
                  {altRange && (
                    <p className="mb-1 font-noto-sans text-[14px] font-semibold text-black">
                      {altRange}
                    </p>
                  )}
                  <p className="mb-2 text-[13px] font-medium text-black">
                    {tea.name}
                  </p>
                  <p className="text-[11px] text-black/70">
                    우림 시간: {rec.laps[0] > 0 ? `${rec.laps[0]}초` : "—"}
                  </p>
                  <p className="text-[11px] text-black/70">
                    Body: {note.body ? `${note.body}` : "—"}
                  </p>
                  <p className="text-[11px] text-black/70">
                    Aftertaste: {note.aftertaste || "—"}
                  </p>
                </div>
              )
            })}
          </div>
          <button
            type="button"
            onClick={handleComplete}
            disabled={saving}
            className={btnClass}
          >
            {saving ? "저장 중…" : "세션 완료"}
          </button>
        </main>
      </div>
    )
  }

  return null
}
