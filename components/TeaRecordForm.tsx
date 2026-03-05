"use client"

import * as React from "react"
import type { InfusionNote } from "@/lib/musuiStore"

const inputClass =
  "w-full border border-black/15 bg-white px-2.5 py-2 text-[13px] outline-none focus:border-black/30 rounded-none"

type Props = {
  laps: number[]
  setLaps: React.Dispatch<React.SetStateAction<number[]>>
  selectedInfusion: 0 | 1 | 2
  infusionNotes: InfusionNote[]
  updateInfusionNote: (index: number, patch: Partial<InfusionNote>) => void
}

export function TeaRecordForm({
  laps,
  setLaps,
  selectedInfusion,
  infusionNotes,
  updateInfusionNote,
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
      setLaps((prev) => {
        const next = [...prev]
        next[selectedInfusion] = timerSec
        return next
      })
      setTimerSec(0)
    } else {
      setIsRunning(true)
    }
  }

  const note = infusionNotes[selectedInfusion] ?? {}

  return (
    <div className="space-y-5 border border-black/10 p-4">
      {/* Water Temperature */}
      <div>
        <label className="mb-2 block text-[12px] font-medium text-black">
          Water Temperature
        </label>
        <div className="flex flex-wrap gap-1">
          {([80, 90, 95, 100] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => updateInfusionNote(selectedInfusion, { waterTempC: c })}
              className={`inline-flex h-6 items-center justify-center whitespace-nowrap border px-2 py-0 text-[8px] font-medium leading-none transition-colors rounded-none ${
                note.waterTempC === c
                  ? "border-black bg-black text-white"
                  : "border-black/20 bg-white text-black/80 hover:border-black/40"
              }`}
            >
              {c}°C
            </button>
          ))}
        </div>
      </div>

      {/* Musui Timer */}
      <div>
        <p className="mb-2 text-[12px] font-medium text-black">Musui Timer</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="tabular-nums tracking-tight text-[20px] font-normal text-black">
            {String(Math.floor(timerSec / 60)).padStart(2, "0")}:
            {String(timerSec % 60).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={handleStartStop}
            className="rounded-none border border-black/20 bg-white px-1.5 py-0.5 text-[9px] font-medium hover:border-black/50"
          >
            {isRunning ? "Record" : "Start"}
          </button>
          {laps[selectedInfusion] > 0 && (
            <span className="text-[11px] text-black/55">
              {selectedInfusion === 0
                ? "1st"
                : selectedInfusion === 1
                  ? "2nd"
                  : "3rd"}
              {" infusion : "}
              {laps[selectedInfusion]}s
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div>
        <label className="mb-2 block text-[12px] font-medium text-black">Body</label>
        <div className="flex flex-row flex-nowrap items-center gap-3">
          <span className="shrink-0 text-[9px] text-black/60">Light</span>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => updateInfusionNote(selectedInfusion, { body: n })}
              className={`h-6 w-6 shrink-0 rounded-full border-2 transition-colors ${
                note.body === n ? "border-black bg-black" : "border-black/30 bg-transparent"
              }`}
              aria-label={n === 1 ? "Light" : n === 7 ? "Full" : `Body ${n}`}
            />
          ))}
          <span className="shrink-0 text-[9px] text-black/60">Full</span>
        </div>
      </div>

      {/* Aroma */}
      <div>
        <label className="mb-2 block text-[12px] font-medium text-black">Aroma</label>
        <div className="flex flex-row flex-nowrap items-center gap-3">
          <span className="shrink-0 text-[9px] text-black/60">Weak</span>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => updateInfusionNote(selectedInfusion, { aroma: n })}
              className={`h-6 w-6 shrink-0 rounded-full border-2 transition-colors ${
                note.aroma === n ? "border-black bg-black" : "border-black/30 bg-transparent"
              }`}
              aria-label={n === 1 ? "Weak" : n === 7 ? "Strong" : `Aroma ${n}`}
            />
          ))}
          <span className="shrink-0 text-[9px] text-black/60">Strong</span>
        </div>
      </div>

      {/* Aftertaste */}
      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-black">Aftertaste</label>
        <textarea
          value={note.aftertaste ?? ""}
          onChange={(e) =>
            updateInfusionNote(selectedInfusion, { aftertaste: e.target.value })
          }
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>
    </div>
  )
}
