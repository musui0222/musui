import Link from "next/link"
import Shell from "@/components/shell"
import { COURSES } from "@/lib/musuiData"

export default function CoursesPage() {
  return (
    <Shell
      title="티코스"
      subtitle="포스터를 고르듯, 오늘의 코스를 선택하세요."
    >
      <div className="m-grid">
        {COURSES.map((c) => (
          <Link key={c.id} href={`/session?course=${encodeURIComponent(c.id)}`}>
            <article className="m-poster">
              {/* Next/Image로 바꿔도 되지만 발표용이면 img로 충분 */}
              <img className="m-posterImg" src={c.posterSrc} alt={c.title} />
              <div className="m-posterMeta">
                <div className="m-kicker">{c.venueKicker ?? "EXHIBITION"}</div>
                <div className="m-title">{c.title}</div>
                <div className="m-desc">{c.subtitle}</div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </Shell>
  )
}
