import Header from "@/components/header"
import TeaCourseGate from "@/components/TeaCourseGate"

export default function SessionsPage() {
  return (
    <div className="min-h-dvh bg-white text-black">
      <Header />
      <main className="mx-auto max-w-[480px] px-4 py-8">
        <TeaCourseGate />
      </main>
    </div>
  )
}
