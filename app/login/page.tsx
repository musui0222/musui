"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/header"
import { createClient } from "@/lib/supabase/client"

const inputClass =
  "w-full border border-black/15 bg-white px-2.5 py-2 text-[13px] outline-none focus:border-black/30 rounded-none"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !key) {
        setError(
          "Supabase 설정이 없습니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY를 넣고 개발 서버를 다시 시작해 주세요."
        )
        return
      }
      const supabase = createClient()
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        setError(err.message)
        return
      }
      router.push("/")
      router.refresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes("fetch") || msg.includes("Failed") || msg.includes("Network")) {
        setError(
          "연결에 실패했습니다. .env.local의 Supabase URL·키를 확인하고, 개발 서버를 다시 시작해 주세요."
        )
      } else {
        setError(msg || "오류가 발생했습니다.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-white text-black">
      <Header />
      <main className="mx-auto max-w-[480px] px-4 py-8">
        <h1 className="mb-6 text-[18px] font-semibold text-black">로그인</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-black/70">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-black/70">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-[12px] text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full border border-black bg-black py-3 text-[13px] font-medium text-white hover:bg-black/90 disabled:opacity-60 rounded-none"
          >
            {loading ? "로그인 중…" : "로그인"}
          </button>
        </form>
        <p className="mt-6 text-center text-[12px] text-black/60">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="underline">
            회원가입
          </Link>
        </p>
      </main>
    </div>
  )
}
