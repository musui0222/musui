"use client"

import * as React from "react"
import Header from "@/components/header"
import { MagazinePostCard } from "@/components/MagazinePostCard"
import type { MagazinePost } from "@/components/MagazinePostCard"
import { MOCK_MAGAZINE_POSTS } from "@/lib/magazinePosts"
import { getPublicArchives } from "@/lib/musuiStore"
import { COURSES } from "@/lib/musuiData"

function isManualItem(item: { courseId: string }) {
  return item.courseId === "manual"
}

function courseTitle(courseId: string) {
  return COURSES.find((c) => c.id === courseId)?.title ?? courseId
}

type ArchiveForFeed = {
  id: string
  createdAt?: string
  authorDisplayName?: string | null
  items: { courseId: string; teaName?: string; memo?: string; teaType?: string; mood?: string; origin?: string; brandOrPurchase?: string; photoDataUrl?: string | null }[]
}

/** Public archives → Magazine feed card data (createdAt 포함해 정렬용) */
function publicArchivesToFeedPosts(publicArchives: ArchiveForFeed[]): { post: MagazinePost; href: string; createdAt: string }[] {
  const items: { post: MagazinePost; href: string; createdAt: string }[] = []
  for (const a of publicArchives) {
    const author = a.authorDisplayName ?? null
    const createdAt = a.createdAt ?? "2000-01-01T00:00:00.000Z"
    a.items.forEach((it, idx) => {
      const titleValue = isManualItem(it)
        ? (it.teaName ?? (it.memo || "이름 없음"))
        : courseTitle(it.courseId)
      const category = isManualItem(it) ? (it.teaType ?? "—") : (it.mood || "—")
      items.push({
        post: {
          id: `archive-${a.id}-${idx}`,
          titleType: "tea",
          titleValue,
          category,
          origin: isManualItem(it) ? (it.origin ?? "—") : "—",
          brandOrPurchase: isManualItem(it) ? (it.brandOrPurchase ?? "—") : "—",
          imageUrl: it.photoDataUrl ?? null,
          authorDisplayName: author,
        },
        href: `/archive/${a.id}/${idx}`,
        createdAt,
      })
    })
  }
  return items
}

const MOCK_POSTS_OLD_DATE = "2000-01-01T00:00:00.000Z"

export default function MagazinePage() {
  const [apiPublicArchives, setApiPublicArchives] = React.useState<ArchiveForFeed[]>([])
  const localPublic = getPublicArchives()
  React.useEffect(() => {
    fetch("/api/archives/public")
      .then((res) => res.json())
      .then((data) => setApiPublicArchives(Array.isArray(data.archives) ? data.archives : []))
      .catch(() => setApiPublicArchives([]))
  }, [])

  const publicItemsFromApi = publicArchivesToFeedPosts(apiPublicArchives)
  const publicItemsFromLocal = publicArchivesToFeedPosts(localPublic)
  const mockItems = MOCK_MAGAZINE_POSTS.map((post) => ({
    post,
    href: undefined as string | undefined,
    createdAt: MOCK_POSTS_OLD_DATE,
  }))
  const allPostsRaw = [...publicItemsFromApi, ...publicItemsFromLocal, ...mockItems]
  const allPosts = [...allPostsRaw].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="min-h-dvh bg-white text-black">
      <Header />
      <main className="mx-auto max-w-[480px] px-4 py-4">
        <h1 className="font-noto-sans mb-3 text-[16px] font-semibold tracking-[0.12em] uppercase text-black">
          Magazine
        </h1>
        <div className="grid grid-cols-2 gap-3">
          {allPosts.map(({ post, href }) => (
            <MagazinePostCard key={post.id} post={post} href={href} />
          ))}
        </div>
      </main>
    </div>
  )
}
