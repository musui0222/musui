"use client"

import * as React from "react"
import type { InfusionNote } from "@/lib/musuiStore"

const inputClass =
  "w-full border border-black/15 bg-white px-2.5 py-2 text-[13px] outline-none focus:border-black/30 rounded-none"

type Props = {
  laps: number[]
  infusionNote: InfusionNote
  onLapsChange: (laps: number[]) => void
  onInfusionNoteChange: (note: InfusionNote) => void
}

/**
 * Archive new 페이지의 Infusion 1 스타일 타이머 + Body + Aftertaste
 * 차종류·산지·브랜드 입력 없음
 */
export function TeaRecordBlock({
  laps,
  infusionNote,
  onLapsChange,
  onInfusionNoteChange,
}: Props) {
  const [timerSec, setTimerSec] = React.useState(0)
  const [isRunning, setIsRunning] = React.useState(false)
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  React.useEffect(() => {
    if (!isRunning) return
    intervalRef.current = setInterval(() => {
      setTimerSec((s) => s + 1)
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  const handleStartStop = () => {
    if (isRunning) {
      setIsRunning(false)
      onLapsChange([timerSec, 0, 0])
      setTimerSec(0)
    } else {
      setIsRunning(true)
    }
  }

  const note = infusionNote ?? {}

  return (
    <div className="border border-black/10 p-4">
      <p className="mb-3 text-[12px] font-medium text-black">Musui Timer</p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="tabular-nums tracking-tight text-[20px] font-normal text-black">
          {String(Math.floor(timerSec / 60)).padStart(2, "0")}:
          {String(timerSec % 60).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={handleStartStop}
          className="border border-black/20 bg-white px-1.5 py-0.5 text-[9px] font-medium hover:border-black/50 rounded-none"
        >
          {isRunning ? "멈추기 (기록)" : "시작"}
        </button>
        {laps[0] > 0 && (
          <span className="text-[11px] text-black/55">기록: {laps[0]}s</span>
        )}
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-[12px] font-medium text-black">Body</label>
        <div className="flex items-end gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <div key={n} className="flex flex-col items-center gap-0.5">
              <button
                type="button"
                onClick={() => onInfusionNoteChange({ ...note, body: n })}
                className={`h-6 w-6 shrink-0 rounded-full border-2 transition-colors ${
                  note.body === n ? "border-black bg-black" : "border-black/30 bg-transparent"
                }`}
                aria-label={n === 1 ? "Light" : n === 7 ? "Full" : `Body ${n}`}
              />
              {n === 1 && <span className="text-[9px] text-black/60">Light</span>}
              {n === 7 && <span className="text-[9px] text-black/60">Full</span>}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-black">AFTERTASTE</label>
        <textarea
          value={note.aftertaste ?? ""}
          onChange={(e) => onInfusionNoteChange({ ...note, aftertaste: e.target.value })}
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>
    </div>
  )
}
