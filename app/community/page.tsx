"use client"

import * as React from "react"
import Header from "@/components/header"
import { CommunityPostCard } from "@/components/CommunityPostCard"
import type { CommunityPost } from "@/components/CommunityPostCard"
import { MOCK_COMMUNITY_POSTS } from "@/lib/communityPosts"
import { getPublicArchives } from "@/lib/musuiStore"
import { COURSES } from "@/lib/musuiData"

function isManualItem(item: { courseId: string }) {
  return item.courseId === "manual"
}

function courseTitle(courseId: string) {
  return COURSES.find((c) => c.id === courseId)?.title ?? courseId
}

/** 공개 아카이브 배열 → 커뮤니티 피드 카드 데이터 */
function publicArchivesToFeedPosts(publicArchives: { id: string; authorDisplayName?: string | null; items: { courseId: string; teaName?: string; memo?: string; teaType?: string; mood?: string; origin?: string; brandOrPurchase?: string; photoDataUrl?: string | null }[] }[]): { post: CommunityPost; href: string }[] {
  const items: { post: CommunityPost; href: string }[] = []
  for (const a of publicArchives) {
    const author = a.authorDisplayName ?? null
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
      })
    })
  }
  return items
}

export default function CommunityPage() {
  const [apiPublicArchives, setApiPublicArchives] = React.useState<{ id: string; authorDisplayName?: string | null; items: { courseId: string; teaName?: string; memo?: string; teaType?: string; mood?: string; origin?: string; brandOrPurchase?: string; photoDataUrl?: string | null }[] }[]>([])
  const localPublic = getPublicArchives()
  React.useEffect(() => {
    fetch("/api/archives/public")
      .then((res) => res.json())
      .then((data) => setApiPublicArchives(Array.isArray(data.archives) ? data.archives : []))
      .catch(() => setApiPublicArchives([]))
  }, [])

  const publicItemsFromApi = publicArchivesToFeedPosts(apiPublicArchives)
  const publicItemsFromLocal = publicArchivesToFeedPosts(localPublic)
  const publicItems = [...publicItemsFromApi, ...publicItemsFromLocal]
  const allPosts = [
    ...publicItems,
    ...MOCK_COMMUNITY_POSTS.map((post) => ({ post, href: undefined as string | undefined })),
  ]

  return (
    <div className="min-h-dvh bg-white text-black">
      <Header />
      <main className="mx-auto max-w-[480px] px-4 py-4">
        <h1 className="font-noto-sans mb-3 text-[16px] font-semibold tracking-[0.12em] uppercase text-black">
          Community
        </h1>
        <div className="grid grid-cols-2 gap-3">
          {allPosts.map(({ post, href }) => (
            <CommunityPostCard key={post.id} post={post} href={href} />
          ))}
        </div>
      </main>
    </div>
  )
}
