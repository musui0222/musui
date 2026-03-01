"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import { addManualArchive, type InfusionNote } from "@/lib/musuiStore"

const TEA_TYPES = [
  "녹차",
  "말차",
  "백차",
  "황차",
  "청차",
  "홍차",
  "흑차",
  "허브차",
  "꽃차",
  "블렌디드티",
] as const

const INFUSION_COUNT = 3

const inputClass =
  "w-full border border-black/15 bg-white px-2.5 py-2 text-[13px] outline-none focus:border-black/30 rounded-none"

export default function NewArchivePage() {
  const router = useRouter()

  const [teaName, setTeaName] = React.useState("")
  const [teaType, setTeaType] = React.useState<string>("")
  const [origin, setOrigin] = React.useState("")
  const [brandOrPurchase, setBrandOrPurchase] = React.useState("")
  const [selectedInfusion, setSelectedInfusion] = React.useState<0 | 1 | 2>(0)
  const [laps, setLaps] = React.useState<number[]>([0, 0, 0])
  const [infusionNotes, setInfusionNotes] = React.useState<InfusionNote[]>(
    Array(INFUSION_COUNT).fill({})
  )
  const [photoDataUrl, setPhotoDataUrl] = React.useState<string | undefined>()
  const [isPublic, setIsPublic] = React.useState(false)
  /** 찻잎의 양 — 기록 전체 공통, 인퓨전 바꿔도 유지 */
  const [leafAmountG, setLeafAmountG] = React.useState<number | undefined>()

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

  const updateInfusionNote = (index: number, patch: Partial<InfusionNote>) => {
    setInfusionNotes((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setPhotoDataUrl(undefined)
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPhotoDataUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    const notesWithLeaf = infusionNotes.map((n) =>
      leafAmountG != null ? { ...n, leafAmountG } : n
    )
    const payload = {
      teaName: teaName.trim() || "이름 없음",
      teaType: teaType || "기타",
      origin: origin.trim() || undefined,
      brandOrPurchase: brandOrPurchase.trim() || undefined,
      laps,
      infusionNotes: notesWithLeaf,
      photoDataUrl,
      isPublic,
    }
    try {
      const res = await fetch("/api/archives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        router.push("/archive")
        return
      }
      const err = await res.json().catch(() => ({}))
      if (res.status === 401) {
        addManualArchive(payload)
        router.push("/archive")
        return
      }
      console.error("[저장 실패]", err)
    } catch {
      // 오프라인 등: 로컬 저장
      addManualArchive(payload)
      router.push("/archive")
      return
    }
    addManualArchive(payload)
    router.push("/archive")
  }

  const note = infusionNotes[selectedInfusion] ?? {}

  return (
    <div className="min-h-dvh bg-white text-black">
      <Header />
      <main className="mx-auto max-w-[480px] px-4 py-6">
        {/* 1) Archive Your Moments — 제목, 굵기·박스 높이 완화 */}
        <div className="mb-8 flex flex-wrap items-baseline gap-2">
          <span className="inline-flex items-center border border-black bg-black px-2.5 py-0.5 text-[15px] font-medium leading-tight text-white">
            Archive
          </span>
          <span className="text-[17px] font-medium text-black tracking-tight">Your Moments</span>
        </div>

        {/* 2) 입력칸 — 크기 줄임, 가이드(placeholder) 없음 */}
        <div className="mb-4">
          <label className="mb-1 block text-[11px] font-medium text-black/70">
            오늘 마실 차의 이름을 입력해주세요.
          </label>
          <input
            type="text"
            value={teaName}
            onChange={(e) => setTeaName(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* 3) 차 종류 — 높이 고정, 가로는 텍스트+패딩으로 유동 (inline-flex) */}
        <div className="mb-4">
          <label className="mb-1 block text-[11px] font-medium text-black/70">차 종류</label>
          <div className="flex flex-wrap gap-1">
            {TEA_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTeaType(type)}
                className={`inline-flex h-6 items-center justify-center whitespace-nowrap border px-2 py-0 text-[8px] font-medium leading-none transition-colors rounded-none ${
                  teaType === type
                    ? "border-black bg-black text-white"
                    : "border-black/20 bg-white text-black/80 hover:border-black/40"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 찻잎의 양 — 기록 전체 공통, 차 종류와 동일한 높이 */}
        <div className="mb-4">
          <label className="mb-1 block text-[11px] font-medium text-black/70">찻잎의 양</label>
          <div className="flex flex-wrap gap-1">
            {([2, 3, 4, 5, 6] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setLeafAmountG(g)}
                className={`inline-flex h-6 items-center justify-center whitespace-nowrap border px-2 py-0 text-[8px] font-medium leading-none transition-colors rounded-none ${
                  leafAmountG === g
                    ? "border-black bg-black text-white"
                    : "border-black/20 bg-white text-black/80 hover:border-black/40"
                }`}
              >
                {g}g
              </button>
            ))}
          </div>
        </div>

        {/* 4) 산지 */}
        <div className="mb-4">
          <label className="mb-1 block text-[11px] font-medium text-black/70">
            해당 차의 산지를 입력해주세요.
          </label>
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* 5) 브랜드 또는 구매처 */}
        <div className="mb-8">
          <label className="mb-1 block text-[11px] font-medium text-black/70">
            해당 차의 브랜드 또는 구매처를 입력해주세요.
          </label>
          <input
            type="text"
            value={brandOrPurchase}
            onChange={(e) => setBrandOrPurchase(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* 6) 인퓨전 선택 — 제목보다 작게 유지 */}
        <div className="mb-3 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedInfusion(i as 0 | 1 | 2)}
              className={`flex-1 border py-1 text-[10px] font-medium transition-colors rounded-none ${
                selectedInfusion === i
                  ? "border-black bg-black text-white"
                  : "border-black/15 bg-white text-black/80 hover:border-black/30"
              }`}
            >
              Infusion {i + 1}
            </button>
          ))}
        </div>

        {/* 7) 기록 창 — Water Temp → Timer → Body → Aroma → Aftertaste */}
        <div className="mb-6 border border-black/10 p-4 space-y-5">
          {/* 1) Water Temperature — 사각형, 높이 축소 (차 종류/Leaf Amount와 동일) */}
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

          {/* 2) Musui Timer — 기존 유지 */}
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
                className="border border-black/20 bg-white px-1.5 py-0.5 text-[9px] font-medium hover:border-black/50 rounded-none"
              >
                {isRunning ? "기록" : "시작"}
              </button>
              {laps[selectedInfusion] > 0 && (
                <span className="text-[11px] text-black/55">
                  {selectedInfusion === 0
                    ? "첫번째 우림"
                    : selectedInfusion === 1
                      ? "두번째 우림"
                      : "세번째 우림"}
                  {" : "}
                  {laps[selectedInfusion]}s
                </span>
              )}
            </div>
          </div>

          {/* 3) Body — Light ○ ○ ○ ○ ○ ○ ○ Full, 한 줄 가로 정렬 */}
          <div>
            <label className="mb-2 block text-[12px] font-medium text-black">Body</label>
            <div className="flex flex-row items-center gap-3 flex-nowrap">
              <span className="text-[9px] text-black/60 shrink-0">Light</span>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => updateInfusionNote(selectedInfusion, { body: n })}
                  className={`h-6 w-6 shrink-0 rounded-full border-2 transition-colors ${
                    note.body === n
                      ? "border-black bg-black"
                      : "border-black/30 bg-transparent"
                  }`}
                  aria-label={n === 1 ? "Light" : n === 7 ? "Full" : `Body ${n}`}
                />
              ))}
              <span className="text-[9px] text-black/60 shrink-0">Full</span>
            </div>
          </div>

          {/* 4) Aroma — Weak ○ ○ ○ ○ ○ ○ ○ Strong, 한 줄 가로 정렬 */}
          <div>
            <label className="mb-2 block text-[12px] font-medium text-black">Aroma</label>
            <div className="flex flex-row items-center gap-3 flex-nowrap">
              <span className="text-[9px] text-black/60 shrink-0">Weak</span>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => updateInfusionNote(selectedInfusion, { aroma: n })}
                  className={`h-6 w-6 shrink-0 rounded-full border-2 transition-colors ${
                    note.aroma === n
                      ? "border-black bg-black"
                      : "border-black/30 bg-transparent"
                  }`}
                  aria-label={n === 1 ? "Weak" : n === 7 ? "Strong" : `Aroma ${n}`}
                />
              ))}
              <span className="text-[9px] text-black/60 shrink-0">Strong</span>
            </div>
          </div>

          {/* 5) Aftertaste — 서술형 텍스트 입력, placeholder 없음 */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-black">
              Aftertaste
            </label>
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

        {/* 8) 찻자리 사진 */}
        <div className="mb-5">
          <label className="mb-1.5 block text-[12px] font-medium text-black/80">
            찻자리 사진
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="block text-[11px] text-black/70 file:mr-2 file:border file:border-black/15 file:bg-white file:px-2.5 file:py-1.5 file:text-[11px] file:rounded-none"
          />
          {photoDataUrl && (
            <img
              src={photoDataUrl}
              alt="찻자리"
              className="mt-2 max-h-32 w-auto border border-black/12 object-cover rounded-none"
            />
          )}
        </div>

        {/* 9) 공개 여부 — 세련되게 */}
        <label className="mb-8 flex cursor-pointer items-center gap-3 border-b border-black/10 pb-6">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 border border-black/25 rounded-none accent-black"
          />
          <span className="text-[12px] font-medium text-black/80">
            공개 (Magazine에 업로드)
          </span>
        </label>

        {/* 10) 저장하기 — 맨 아래 */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full border border-black bg-black py-3 text-[13px] font-medium text-white hover:bg-black/90 rounded-none"
        >
          저장하기
        </button>
      </main>
    </div>
  )
}
