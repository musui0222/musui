import Link from "next/link"

type Item = { id: string; title: string; subtitle?: string; poster?: string }

const TEA: Item[] = [
  { id: "tea-1", title: "무이산 금준미", subtitle: "홍차", poster: "/posters/tea-1.png" },
  { id: "tea-2", title: "청향 사계춘", subtitle: "청차", poster: "/posters/tea-2.png" },
  { id: "tea-3", title: "일월담", subtitle: "홍차", poster: "/posters/tea-3.png" },
  { id: "tea-4", title: "아리산 고산차", subtitle: "청차", poster: "/posters/tea-4.png" },
]

const TEA_COURSE: Item[] = [
  { id: "course-1", title: "Tea Course 01", subtitle: "20–30 min" },
  { id: "course-2", title: "Tea Course 02", subtitle: "Guided session" },
  { id: "course-3", title: "Tea Course 03", subtitle: "Archive-ready" },
]

function PosterPlaceholder({ label }: { label: string }) {
  return (
    <div className="relative w-full overflow-hidden border border-black/15 bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
      <div className="aspect-[3/4] w-full" />
      <div className="absolute inset-0 flex items-start justify-start p-4">
        <div className="text-[12px] tracking-[0.12em] text-black/35">{label}</div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-white text-black">
      {/* 인라인 헤더 — Header 컴포넌트 의존 제거로 에러 회피 */}
      <header className="border-b border-black/15">
        <div className="relative mx-auto flex max-w-[480px] items-center justify-between px-3 py-2.5">
          <div className="w-16 shrink-0" />
          <Link href="/" className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            {/* next/image 제거 — 서버 에러 시 임시 img로 복구 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-graphic.png" alt="musui" style={{ height: 28, width: "auto" }} />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/signup" className="rounded-full bg-black px-2.5 py-1.5 text-[12px] leading-none text-white" style={{ color: "#fff" }}>Musui 회원가입</Link>
            <Link href="/login" className="text-[12px] leading-none text-black/75">로그인</Link>
          </div>
        </div>
        <nav className="mx-auto max-w-[480px] px-3">
          <div className="flex gap-6 py-2.5 text-[13px] font-medium">
            <Link href="/sessions">Sessions</Link>
            <Link href="/community">Community</Link>
            <Link href="/archive">My Archive</Link>
          </div>
          <div className="h-px bg-black/15" />
        </nav>
      </header>
      <main className="mx-auto max-w-[480px] px-4 py-8">
        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-[18px] font-semibold tracking-[0.18em] uppercase">Tea</h2>
            <span className="text-[12px] tracking-[0.12em] text-black/45">
              products · 4 items
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {TEA.map((item) => (
              <Link key={item.id} href={`/tea/${item.id}`} className="group">
                <div className="w-full overflow-hidden border border-black/15 bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
                  {item.poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.poster}
                      alt=""
                      className="block w-full h-auto align-top"
                    />
                  ) : (
                    <div className="aspect-[3/4] w-full flex items-center justify-center bg-black/5">
                      <span className="text-[12px] tracking-[0.12em] text-black/35">TEA POSTER</span>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <div className="text-[14px] font-semibold tracking-[0.04em]">
                    {item.title}
                  </div>
                  {item.subtitle && (
                    <div className="mt-1 text-[12px] tracking-[0.08em] text-black/55">
                      {item.subtitle}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-[18px] font-semibold tracking-[0.18em] uppercase">TeaCourse</h2>
            <span className="text-[12px] tracking-[0.12em] text-black/45">
              courses · 3 items
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {TEA_COURSE.map((item) => (
              <Link key={item.id} href={`/courses/${item.id}`} className="group">
                <PosterPlaceholder label="TEA COURSE POSTER" />
                <div className="mt-3">
                  <div className="text-[14px] font-semibold tracking-[0.04em]">
                    {item.title}
                  </div>
                  {item.subtitle && (
                    <div className="mt-1 text-[12px] tracking-[0.08em] text-black/55">
                      {item.subtitle}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
