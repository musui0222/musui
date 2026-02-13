import Link from "next/link"
import Header from "@/components/header"

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

function PosterCard({
  item,
  href,
  posterNode,
}: {
  item: Item
  href: string
  posterNode: React.ReactNode
}) {
  return (
    <Link href={href} className="group block">
      <div className="mx-auto w-full max-w-[140px] overflow-hidden border border-black/10 bg-white">
        {posterNode}
      </div>
      <div className="mt-2 text-center">
        <div className="text-[12px] font-medium tracking-[0.02em] text-black">
          {item.title}
        </div>
        {item.subtitle && (
          <div className="mt-0.5 text-[11px] tracking-[0.04em] text-black/55">
            {item.subtitle}
          </div>
        )}
      </div>
    </Link>
  )
}

function PosterPlaceholder({ label }: { label: string }) {
  return (
    <div className="relative aspect-[3/4] w-full bg-black/[0.04]">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] tracking-[0.08em] text-black/30">{label}</span>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-white text-black">
      <Header />
      <main className="mx-auto max-w-[480px] px-4 py-8">
        <section className="mb-10">
          <h2 className="font-noto-sans mb-4 text-[16px] font-semibold tracking-[0.14em] uppercase text-black">
            Tea
          </h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3">
            {TEA.map((item) => (
              <PosterCard
                key={item.id}
                item={item}
                href={`/tea/${item.id}`}
                posterNode={
                  item.poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.poster}
                      alt=""
                      className="block w-full object-contain"
                    />
                  ) : (
                    <PosterPlaceholder label="TEA POSTER" />
                  )
                }
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-noto-sans mb-4 text-[16px] font-semibold tracking-[0.14em] uppercase text-black">
            Tea Course
          </h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3">
            {TEA_COURSE.map((item) => (
              <PosterCard
                key={item.id}
                item={item}
                href={`/session?course=${encodeURIComponent(item.id)}`}
                posterNode={<PosterPlaceholder label="TEA COURSE POSTER" />}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
