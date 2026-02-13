import Link from "next/link";
import Header from "@/components/header";
import { MOCK_COMMUNITY_POSTS } from "@/lib/communityPosts";
export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = MOCK_COMMUNITY_POSTS.find((p) => p.id === id);

  if (!post) {
    return (
      <div className="min-h-dvh bg-white px-4 py-12 text-center">
        <Header />
        <p className="mt-8 text-black/60">게시글을 찾을 수 없습니다.</p>
        <Link href="/community" className="mt-4 inline-block text-[14px] underline">
          커뮤니티로
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white text-black">
      <Header />
      <main className="mx-auto max-w-[480px] px-4 py-8">
        <Link href="/community" className="text-[14px] text-black/70 hover:text-black">
          ← Community
        </Link>

        <article className="mt-6 border border-black/12 bg-white">
          {/* 상단: ■ + 제목 */}
          <div className="flex items-start gap-2 border-b border-black/10 px-4 py-4">
            <span className="mt-0.5 text-[10px] leading-none text-black" aria-hidden>
              ■
            </span>
            <div className="flex-1 min-w-0">
              <h1 className="text-[18px] font-medium tracking-[0.02em] text-black">
                {post.titleValue}
              </h1>
            </div>
          </div>

          <div className="space-y-2 border-b border-black/10 px-4 py-4">
            <div className="flex justify-between gap-4 text-[13px]">
              <span className="text-black/50">Category</span>
              <span className="font-medium text-black">{post.category || "—"}</span>
            </div>
            <div className="flex justify-between gap-4 text-[13px]">
              <span className="text-black/50">Origin</span>
              <span className="font-medium text-black">{post.origin || "—"}</span>
            </div>
            <div className="flex justify-between gap-4 text-[13px]">
              <span className="text-black/50">Brand or Purchase Location</span>
              <span className="font-medium text-black">{post.brandOrPurchase || "—"}</span>
            </div>
          </div>

          <div className="relative aspect-[4/3] w-full bg-[#f5f5f5]">
            {post.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.imageUrl}
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
  );
}
