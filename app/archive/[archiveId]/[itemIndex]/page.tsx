"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import Header from "@/components/header"
import { getArchives } from "@/lib/musuiStore"
import { COURSES } from "@/lib/musuiData"

function courseTitle(courseId: string) {
  return COURSES.find((c) => c.id === courseId)?.title ?? courseId
}

function isManualItem(item: { courseId: string }) {
  return item.courseId === "manual"
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function ArchiveDetailPage() {
  const params = useParams()
  const archiveId = params.archiveId as string
  const itemIndex = parseInt(String(params.itemIndex), 10)

  const [archive, setArchive] = React.useState<ReturnType<typeof getArchives>[0] | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/archives/${archiveId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        setArchive(data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [archiveId])

  const localArchives = React.useMemo(() => getArchives(), [])
  const archiveResolved = archive ?? localArchives.find((a) => a.id === archiveId)
  const item = archiveResolved?.items[itemIndex]

  if (loading && !archiveResolved) {
    return (
      <div className="min-h-dvh bg-white px-4 py-12 text-center">
        <Header />
        <p className="mt-8 text-black/60">불러오는 중…</p>
      </div>
    )
  }

  if (!archiveResolved || item === undefined) {
    return (
      <div className="min-h-dvh bg-white px-4 py-12 text-center">
        <Header />
        <p className="mt-8 text-black/60">기록을 찾을 수 없습니다.</p>
        <Link href="/archive" className="mt-4 inline-block text-[14px] underline">
          My Archive로
        </Link>
      </div>
    )
  }

  const archiveForDate = archiveResolved
  const itemForDisplay = item
  const title = isManualItem(itemForDisplay)
    ? (itemForDisplay.teaName ?? (itemForDisplay.memo || "이름 없음"))
    : courseTitle(itemForDisplay.courseId)
  const category = isManualItem(itemForDisplay) ? (itemForDisplay.teaType ?? "—") : (itemForDisplay.mood || "—")
  const origin = isManualItem(itemForDisplay) ? (itemForDisplay.origin ?? "—") : "—"
  const brandOrPurchase = isManualItem(itemForDisplay) ? (itemForDisplay.brandOrPurchase ?? "—") : "—"
  const hasLaps = itemForDisplay.laps && itemForDisplay.laps.length > 0 && itemForDisplay.laps.some((s) => s > 0)

  return (
    <div className="min-h-dvh bg-white text-black">
      <Header />
      <main className="mx-auto max-w-[480px] px-4 py-8">
        <Link href="/archive" className="text-[14px] text-black/70 hover:text-black">
          ← My Archive
        </Link>

        <article className="mt-6 border border-black/12 bg-white">
          {/* ■ + 제목 */}
          <div className="flex items-start gap-2 border-b border-black/10 px-4 py-4">
            <span className="mt-0.5 text-[10px] leading-none text-black" aria-hidden>
              ■
            </span>
            <div className="flex-1 min-w-0">
              <h1 className="text-[18px] font-medium tracking-[0.02em] text-black">
                {title}
              </h1>
            </div>
          </div>

          {/* 기록한 날짜 */}
          <div className="border-b border-black/10 px-4 py-3">
            <div className="flex justify-between gap-4 text-[13px]">
              <span className="text-black/50">기록한 날짜</span>
              <span className="font-medium text-black">{formatDate(archiveForDate.createdAt)}</span>
            </div>
          </div>

          {/* Category / Origin / Brand or Purchase */}
          <div className="space-y-2 border-b border-black/10 px-4 py-4">
            <div className="flex justify-between gap-4 text-[13px]">
              <span className="text-black/50">Category</span>
              <span className="font-medium text-black">{category}</span>
            </div>
            <div className="flex justify-between gap-4 text-[13px]">
              <span className="text-black/50">Origin</span>
              <span className="font-medium text-black">{origin}</span>
            </div>
            <div className="flex justify-between gap-4 text-[13px]">
              <span className="text-black/50">Brand or Purchase Location</span>
              <span className="font-medium text-black">{brandOrPurchase}</span>
            </div>
          </div>

          {/* 우림 시간 */}
          {hasLaps && (
            <div className="space-y-2 border-b border-black/10 px-4 py-4">
              <div className="flex justify-between gap-4 text-[13px]">
                <span className="text-black/50">우림 시간</span>
                <span className="text-right font-medium text-black">
                  {itemForDisplay.laps!
                    .map((s, i) => (s > 0 ? `${i + 1}차 ${s}초` : null))
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </span>
              </div>
            </div>
          )}

          {/* 찻자리 사진 */}
          <div className="relative aspect-[4/3] w-full bg-[#f5f5f5]">
            {itemForDisplay.photoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={itemForDisplay.photoDataUrl}
                alt=""
                className="h-full w-full object-cover object-center"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[12px] tracking-[0.08em] text-black/35">
                찻자리 사진
              </div>
            )}
          </div>
        </article>
      </main>
    </div>
  )
}
