import Link from "next/link"
import Header from "@/components/header"

type Item = { id: string; title: string; subtitle?: string; poster?: string }

const TEA_COURSE_ITEMS: Item[] = [
  { id: "session-1", title: "고도(高度)", subtitle: "홍차", poster: "/posters/godo.png" },
  { id: "session-2", title: "순환 循環", subtitle: "청차", poster: "/posters/sunhwan.png" },
  { id: "session-3", title: "발견(發見)", subtitle: "홍차", poster: "/posters/balgyeon.png" },
  { id: "session-4", title: "봄(春)", subtitle: "청차", poster: "/posters/bom.png" },
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

export default function SessionsPage() {
  return (
    <div className="min-h-dvh bg-white text-black">
      <Header />
      <main className="mx-auto max-w-[480px] px-4 py-8">
        <section>
          <h1 className="font-noto-sans mb-4 text-[16px] font-semibold tracking-[0.14em] uppercase text-black">
            Tea Course
          </h1>
          <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3">
            {TEA_COURSE_ITEMS.map((item) => (
              <PosterCard
                key={item.id}
                item={item}
                href={`/session?course=${encodeURIComponent(item.id)}`}
                posterNode={
                  item.poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.poster}
                      alt=""
                      className="aspect-[3/4] w-full object-cover object-center"
                    />
                  ) : (
                    <PosterPlaceholder label="POSTER" />
                  )
                }
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
