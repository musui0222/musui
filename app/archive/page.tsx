"use client"

import * as React from "react"
import Link from "next/link"
import Shell from "@/components/shell"
import { getArchives, toggleArchivePublic, type SessionArchive } from "@/lib/musuiStore"
import { ArchiveCard } from "@/components/ArchiveCard"

function AddButton() {
  return (
    <Link
      href="/archive/new"
      aria-label="새 찻자리 기록"
      className="flex h-8 w-8 items-center justify-center rounded-full border border-black/25 text-[18px] leading-none text-black/80 hover:border-black/50 hover:text-black"
    >
      +
    </Link>
  )
}

export default function ArchivePage() {
  const [archives, setArchives] = React.useState<SessionArchive[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchArchives = React.useCallback(async () => {
    try {
      const res = await fetch("/api/archives")
      const data = await res.json()
      if (res.ok && Array.isArray(data.archives)) {
        setArchives(data.archives)
        return
      }
    } catch {
      // fallback to local
    }
    setArchives(getArchives())
  }, [])

  React.useEffect(() => {
    setLoading(true)
    fetchArchives().finally(() => setLoading(false))
  }, [fetchArchives])

  const onToggle = async (id: string, v: boolean) => {
    try {
      const res = await fetch(`/api/archives/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: v }),
      })
      if (res.ok) {
        await fetchArchives()
        return
      }
    } catch {
      // fallback to local
    }
    toggleArchivePublic(id, v)
    setArchives(getArchives())
  }

  const cards = archives.flatMap((a) =>
    a.items.map((item, itemIndex) => ({
      archiveId: a.id,
      itemIndex,
      isPublic: a.isPublic,
      item,
    }))
  )

  return (
    <Shell
      title="My Archive"
      subtitle="세션종료시 자동으로 기록이 저장됩니다. + 버튼으로 새로운 찻자리 기록을 저장할 수 있습니다."
      rightAction={<AddButton />}
    >
      {loading ? (
        <div className="text-[13px] text-black/60">불러오는 중…</div>
      ) : archives.length === 0 ? (
        <div className="text-[13px] text-black/70">
          아직 아카이브가 없습니다. <Link href="/archive/new" className="underline">새 기록 추가</Link> 또는{" "}
          <Link href="/sessions" className="underline">세션을 시작</Link>해보세요.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {cards.map(({ archiveId, itemIndex, isPublic, item }) => (
            <ArchiveCard
              key={`${archiveId}-${itemIndex}`}
              archiveId={archiveId}
              itemIndex={itemIndex}
              item={item}
              isPublic={isPublic}
              onTogglePublic={(v) => onToggle(archiveId, v)}
            />
          ))}
        </div>
      )}
    </Shell>
  )
}
