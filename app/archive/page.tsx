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
  const [user, setUser] = React.useState<{ id: string } | null>(null)
  const [authLoading, setAuthLoading] = React.useState(true)
  const [archives, setArchives] = React.useState<SessionArchive[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/auth/user")
      .then((res) => res.json())
      .then((data: { user: { id: string } | null }) => {
        setUser(data.user)
      })
      .finally(() => setAuthLoading(false))
  }, [])

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
    setArchives((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isPublic: v } : a))
    )
    try {
      const res = await fetch(`/api/archives/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: v }),
      })
      if (res.ok) return
    } catch {
      // keep optimistic state
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

  if (!authLoading && !user) {
    return (
      <Shell title="My Archive" subtitle="">
        <div className="rounded border border-black/12 bg-black/[0.02] px-4 py-5 text-center">
          <p className="text-[13px] text-black/80">
            마이 아카이브는 로그인 후 이용할 수 있습니다.
          </p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell
      title="My Archive"
      subtitle="세션종료시 자동으로 기록이 저장됩니다. + 버튼으로 새로운 찻자리 기록을 저장할 수 있습니다."
      rightAction={user ? <AddButton /> : undefined}
    >
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex aspect-[3/4] flex-col overflow-hidden border border-black/12 bg-white"
              aria-hidden
            >
              <div className="h-8 shrink-0 animate-pulse bg-black/5" />
              <div className="grid grid-cols-2 gap-1 px-2.5 py-1.5">
                <div className="h-3 animate-pulse bg-black/5" />
                <div className="h-3 animate-pulse bg-black/5" />
                <div className="h-3 animate-pulse bg-black/5" />
                <div className="h-3 animate-pulse bg-black/5" />
              </div>
              <div className="min-h-0 flex-1 animate-pulse bg-black/5" />
            </div>
          ))}
        </div>
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
