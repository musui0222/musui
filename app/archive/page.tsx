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

  React.useEffect(() => {
    setArchives(getArchives())
  }, [])

  const onToggle = (id: string, v: boolean) => {
    toggleArchivePublic(id, v)
    setArchives(getArchives())
  }

  const cards = archives.flatMap((a) =>
    a.items.map((item) => ({ archiveId: a.id, isPublic: a.isPublic, item }))
  )

  return (
    <Shell
      title="My Archive"
      subtitle="세션종료시 자동으로 기록이 저장됩니다. + 버튼으로 새로운 찻자리 기록을 저장할 수 있습니다."
      rightAction={<AddButton />}
    >
      {archives.length === 0 ? (
        <div className="text-[13px] text-black/70">
          아직 아카이브가 없습니다. <Link href="/archive/new" className="underline">새 기록 추가</Link> 또는{" "}
          <Link href="/sessions" className="underline">세션을 시작</Link>해보세요.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {cards.map(({ archiveId, isPublic, item }, idx) => (
            <ArchiveCard
              key={`${archiveId}-${idx}`}
              archiveId={archiveId}
              itemIndex={idx}
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
