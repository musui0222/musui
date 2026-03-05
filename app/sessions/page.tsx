import { Suspense } from "react"
import Header from "@/components/header"
import TeaCourseList from "@/components/TeaCourseList"

export default function SessionsPage() {
  return (
    <div className="min-h-dvh bg-white text-black">
      <Header />
      <main className="mx-auto max-w-[480px] px-4 py-8 lg:max-w-none">
        <Suspense fallback={<p className="text-[14px] text-black/60">로딩 중...</p>}>
          <TeaCourseList />
        </Suspense>
      </main>
    </div>
  )
}
