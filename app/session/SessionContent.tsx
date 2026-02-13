"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Shell from "@/components/shell"
import { COURSES, getCourseById } from "@/lib/musuiData"
import { addArchive, type BrewNote, type SessionArchive } from "@/lib/musuiStore"

type Status = "running" | "stopped"

function msToSeconds(ms: number) {
  return Math.max(0, Math.round(ms / 1000))
}

function formatOrdinal(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n}st`
  if (mod10 === 2 && mod100 !== 12) return `${n}nd`
  if (mod10 === 3 && mod100 !== 13) return `${n}rd`
  return `${n}th`
}

type Step = "guide" | "brew" | "note" | "confirmNext"

export function SessionContent({ initialCourseId }: { initialCourseId: string | null }) {
  const router = useRouter()
  const course = getCourseById(initialCourseId) ?? COURSES[0]

  const [courseIndex, setCourseIndex] = React.useState(() => {
    const idx = COURSES.findIndex((c) => c.id === course.id)
    return idx >= 0 ? idx : 0
  })

  const currentCourse = COURSES[courseIndex]
  const [step, setStep] = React.useState<Step>("guide")
  const [status, setStatus] = React.useState<Status>("stopped")
  const [laps, setLaps] = React.useState<number[]>([])
  const [segmentElapsedMs, setSegmentElapsedMs] = React.useState(0)
  const segmentStartAtRef = React.useRef<number | null>(null)
  const rafRef = React.useRef<number | null>(null)
  const [, setNow] = React.useState(0)

  const currentElapsedMs =
    status === "running" && segmentStartAtRef.current != null
      ? segmentElapsedMs + (Date.now() - segmentStartAtRef.current)
      : segmentElapsedMs

  const currentElapsed = msToSeconds(currentElapsedMs)

  React.useEffect(() => {
    if (status !== "running") {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      return
    }
    const loop = () => {
      setNow(Date.now())
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [status])

  const start = () => {
    if (status === "running") return
    segmentStartAtRef.current = Date.now()
    setStatus("running")
  }

  const stop = () => {
    if (status !== "running") return
    const s = segmentStartAtRef.current
    if (s != null) setSegmentElapsedMs((p) => p + (Date.now() - s))
    segmentStartAtRef.current = null
    setStatus("stopped")
  }

  const lap = () => {
    if (status !== "running") return
    setLaps((prev) => [...prev, currentElapsed])
    setSegmentElapsedMs(0)
    segmentStartAtRef.current = Date.now()
  }

  const [mood, setMood] = React.useState("")
  const [memo, setMemo] = React.useState("")
  const [photoDataUrl, setPhotoDataUrl] = React.useState<string | undefined>(undefined)

  const onPickPhoto: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoDataUrl(String(reader.result))
    reader.readAsDataURL(file)
  }

  const finishCourse = () => {
    stop()
    setStep("confirmNext")
  }

  const saveNoteToTemp = (): BrewNote => ({
    courseId: currentCourse.id,
    laps,
    mood,
    memo,
    photoDataUrl,
  })

  const [tempItems, setTempItems] = React.useState<BrewNote[]>([])

  const onChooseWrite = () => setStep("note")
  const onChooseSkip = () => {
    setTempItems((prev) => [...prev, saveNoteToTemp()])
    setStep("confirmNext")
  }

  const onSubmitNote = () => {
    setTempItems((prev) => [...prev, saveNoteToTemp()])
    setMood("")
    setMemo("")
    setPhotoDataUrl(undefined)
    setStep("confirmNext")
  }

  const resetCourseTimerForNext = () => {
    setStatus("stopped")
    setLaps([])
    setSegmentElapsedMs(0)
    segmentStartAtRef.current = null
  }

  const goNextCourseOrEnd = (next: "next" | "end") => {
    if (next === "next" && courseIndex < COURSES.length - 1) {
      resetCourseTimerForNext()
      setCourseIndex((i) => i + 1)
      setStep("guide")
      return
    }
    const archive: SessionArchive = {
      id: `sess_${Date.now()}`,
      createdAt: new Date().toISOString(),
      items: tempItems,
      isPublic: false,
    }
    addArchive(archive)
    router.push("/archive")
  }

  return (
    <Shell
      title="티코스 세션"
      subtitle={`${currentCourse.title} · 단계: ${step}`}
    >
      {step === "guide" && (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>가이드</div>
          <div style={{ lineHeight: 1.6, opacity: 0.85 }}>{currentCourse.guide}</div>
          <div style={{ opacity: 0.7, fontSize: 13 }}>{currentCourse.suggestedLapsHint}</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => setStep("brew")}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.16)",
                background: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              우림 시작
            </button>
            <button
              onClick={() => router.push("/courses")}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.16)",
                background: "white",
                fontWeight: 900,
                cursor: "pointer",
                opacity: 0.85,
              }}
            >
              코스 다시 고르기
            </button>
          </div>
        </div>
      )}

      {step === "brew" && (
        <div style={{ display: "grid", gap: 14 }}>
          <div
            style={{
              border: "1px solid rgba(0,0,0,0.10)",
              borderRadius: 14,
              padding: 14,
            }}
          >
            <div style={{ opacity: 0.7, fontWeight: 800, marginBottom: 6 }}>자동 기록 타이머</div>
            <div style={{ fontSize: 44, fontWeight: 950, letterSpacing: -1 }}>
              {currentElapsed}s
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <button onClick={start} style={btn()}>Start</button>
              <button onClick={stop} style={btn()}>Stop</button>
              <button onClick={lap} disabled={status !== "running"} style={btn(status !== "running")}>
                Lap (다음 우림 시작)
              </button>
              <button onClick={finishCourse} style={{ ...btn(), opacity: 0.9 }}>이 코스 종료</button>
            </div>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 900 }}>기록</div>
            {laps.length === 0 ? (
              <div style={{ opacity: 0.7 }}>아직 Lap 기록이 없습니다.</div>
            ) : (
              <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
                {laps.map((sec, idx) => (
                  <li key={`${idx}-${sec}`} style={{ display: "flex", gap: 10 }}>
                    <span style={{ width: 56, opacity: 0.75 }}>{formatOrdinal(idx + 1)}</span>
                    <b>{sec}s</b>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}

      {step === "confirmNext" && (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>
            해당 차에 대한 감상을 기록하시겠습니까?
          </div>
          <div style={{ opacity: 0.75 }}>
            (선택) 감상/다구/사진을 남기거나, 바로 다음 코스로 넘어갈 수 있어요.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={onChooseWrite} style={btn()}>기록할래요</button>
            <button onClick={onChooseSkip} style={btn()}>건너뛰기</button>
            <div style={{ width: "100%", height: 1, background: "rgba(0,0,0,0.08)", margin: "6px 0" }} />
            <button
              onClick={() => goNextCourseOrEnd("next")}
              style={btn()}
              disabled={courseIndex >= COURSES.length - 1}
            >
              다음 코스
            </button>
            <button onClick={() => goNextCourseOrEnd("end")} style={btn()}>
              세션 종료(아카이브 생성)
            </button>
          </div>
        </div>
      )}

      {step === "note" && (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>[선택적 기록] 감상 남기기</div>
          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontWeight: 900 }}>감상 키워드</label>
            <input
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="예: 맑음 / 단정함 / 달콤한 여운 ..."
              style={input()}
            />
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontWeight: 900 }}>메모</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="한 줄만 적어도 충분해요."
              rows={4}
              style={{ ...input(), resize: "vertical" }}
            />
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontWeight: 900 }}>사진(발표용 임시 업로드)</label>
            <input type="file" accept="image/*" onChange={onPickPhoto} />
            {photoDataUrl ? (
              <img
                src={photoDataUrl}
                alt="uploaded"
                style={{ width: 220, borderRadius: 12, border: "1px solid rgba(0,0,0,0.10)" }}
              />
            ) : null}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={onSubmitNote} style={btn()}>저장하고 돌아가기</button>
            <button onClick={() => setStep("confirmNext")} style={btn()}>취소</button>
          </div>
        </div>
      )}
    </Shell>
  )
}

function btn(disabled?: boolean) {
  return {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.16)",
    background: disabled ? "rgba(0,0,0,0.06)" : "white",
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
  } as React.CSSProperties
}

function input() {
  return {
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.16)",
    outline: "none",
  } as React.CSSProperties
}
