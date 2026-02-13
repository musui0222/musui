"use client"

import Link from "next/link"
import type { BrewNote } from "@/lib/musuiStore"
import { COURSES } from "@/lib/musuiData"

function courseTitle(courseId: string) {
  return COURSES.find((c) => c.id === courseId)?.title ?? courseId
}

function isManualItem(item: BrewNote) {
  return item.courseId === "manual"
}

type Props = {
  archiveId: string
  itemIndex: number
  item: BrewNote
  isPublic: boolean
  onTogglePublic: (v: boolean) => void
}

export function ArchiveCard({ archiveId, itemIndex, item, isPublic, onTogglePublic }: Props) {
  const title = isManualItem(item)
    ? (item.teaName ?? (item.memo || "이름 없음"))
    : courseTitle(item.courseId)
  const category = isManualItem(item) ? (item.teaType ?? "—") : (item.mood || "—")
  const origin = isManualItem(item) ? (item.origin ?? "—") : "—"
  const brandOrPurchase = isManualItem(item) ? (item.brandOrPurchase ?? "—") : "—"
  const imageUrl = item.photoDataUrl ?? null

  return (
    <Link
      href={`/archive/${archiveId}/${itemIndex}`}
      className="flex aspect-[3/4] flex-col overflow-hidden border border-black/12 bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
    >
      {/* 상단: ■ + 제목 + 공개 토글 */}
      <div className="flex shrink-0 items-center gap-1.5 border-b border-black/10 px-2.5 py-2">
        <span className="text-[8px] leading-none text-black" aria-hidden>
          ■
        </span>
        <h2 className="min-w-0 flex-1 truncate text-[12px] font-medium tracking-[0.02em] text-black">
          {title}
        </h2>
        <label
          className="flex shrink-0 cursor-pointer items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => onTogglePublic(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="h-3 w-3 border border-black/25 rounded-none accent-black"
          />
          <span className="text-[9px] text-black/60">
            공개 {isPublic && "(커뮤니티 노출)"}
          </span>
        </label>
      </div>

      {/* 정보 행: Category / Origin / Brand or Purchase */}
      <div className="grid shrink-0 grid-cols-[auto_1fr] gap-x-1.5 gap-y-0.5 border-b border-black/10 px-2.5 py-1.5 text-[10px]">
        <span className="text-black/50">Category</span>
        <span className="truncate text-right font-medium text-black">{category}</span>
        <span className="text-black/50">Origin</span>
        <span className="truncate text-right font-medium text-black">{origin}</span>
        <span className="text-black/50">Brand or Purchase</span>
        <span className="truncate text-right font-medium text-black">{brandOrPurchase}</span>
      </div>

      {/* 찻자리 사진 영역 */}
      <div className="relative min-h-0 flex-1 bg-[#f5f5f5]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] tracking-[0.08em] text-black/35">
            찻자리 사진
          </div>
        )}
      </div>
    </Link>
  )
}
