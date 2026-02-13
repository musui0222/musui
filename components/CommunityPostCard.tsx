import Link from "next/link";

export type PostTitleType = "tea" | "musui-tea" | "course";

export const TITLE_LABELS: Record<PostTitleType, { ko: string; en: string }> = {
  tea: { ko: "차이름", en: "Tea Name" },
  "musui-tea": { ko: "무수이티이름", en: "Musui Tea Name" },
  course: { ko: "코스이름", en: "Course Name" },
};

export type CommunityPost = {
  id: string;
  titleType: PostTitleType;
  titleValue: string;
  category: string;
  origin: string;
  brandOrPurchase: string;
  imageUrl: string | null;
};

type Props = {
  post: CommunityPost;
  /** 지정 시 이 주소로 이동 (예: 아카이브 상세 /archive/xxx/0) */
  href?: string;
};

export function CommunityPostCard({ post, href }: Props) {
  const { titleType, titleValue, category, origin, brandOrPurchase, imageUrl } = post;
  const { ko: labelKo, en: labelEn } = TITLE_LABELS[titleType];
  const linkHref = href ?? `/community/${post.id}`;

  return (
    <Link
      href={linkHref}
      className="group flex aspect-[3/4] flex-col overflow-hidden border border-black/12 bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
    >
      {/* 상단: ■ + 제목 */}
      <div className="flex shrink-0 items-center gap-1.5 border-b border-black/10 px-2.5 py-2">
        <span className="text-[8px] leading-none text-black" aria-hidden>
          ■
        </span>
        <h2 className="min-w-0 flex-1 truncate text-[12px] font-medium tracking-[0.02em] text-black">
          {titleValue || `${labelKo} (${labelEn})`}
        </h2>
      </div>

      {/* 정보 행: Category / Origin / Brand or Purchase */}
      <div className="grid shrink-0 grid-cols-[auto_1fr] gap-x-1.5 gap-y-0.5 border-b border-black/10 px-2.5 py-1.5 text-[10px]">
        <span className="text-black/50">Category</span>
        <span className="truncate text-right font-medium text-black">{category || "—"}</span>
        <span className="text-black/50">Origin</span>
        <span className="truncate text-right font-medium text-black">{origin || "—"}</span>
        <span className="text-black/50">Brand or Purchase</span>
        <span className="truncate text-right font-medium text-black">{brandOrPurchase || "—"}</span>
      </div>

      {/* 찻자리 사진 영역 — 남은 높이 채움 */}
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
  );
}
