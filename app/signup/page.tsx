"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/header"
import { createClient } from "@/lib/supabase/client"

const inputClass =
  "w-full border border-black/15 bg-white px-2.5 py-2 text-[13px] outline-none focus:border-black/30 rounded-none"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [done, setDone] = React.useState(false)

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
      const { error: err } = await supabase.auth.signUp({ email, password })
      if (err) {
        setError(err.message)
        const status = (err as { status?: number }).status
        if (status === 401 || status === 403) {
          setError(
            `${err.message} (Status ${status}) → Dashboard → Settings → API에서 Legacy anon(public) JWT 키(eyJ...)로 바꾸고 서버 재시작 후 다시 시도하세요.`
          )
        }
        return
      }
      setDone(true)
      router.refresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      const isCorsOrFetch =
        msg.includes("fetch") ||
        msg.includes("Failed") ||
        msg.includes("Network") ||
        msg.toLowerCase().includes("cors") ||
        msg.toLowerCase().includes("access control")
      if (isCorsOrFetch) {
        setError(
          "연결에 실패했습니다 (CORS/네트워크). Supabase Dashboard → Authentication → URL Configuration에서 Site URL에 http://localhost:3004, Redirect URLs에 http://localhost:3004 와 http://localhost:3004/auth/callback 를 추가한 뒤 저장하세요. .env.local 확인 후 개발 서버를 재시작하세요."
        )
      } else {
        setError(msg || "오류가 발생했습니다.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-dvh bg-white text-black">
        <Header />
        <main className="mx-auto max-w-[480px] px-4 py-8">
          <h1 className="mb-4 text-[18px] font-semibold text-black">가입 완료</h1>
          <p className="mb-6 text-[13px] text-black/80">
            가입한 이메일로 확인 메일을 보냈을 수 있습니다. 링크를 클릭한 뒤 로그인해 주세요.
          </p>
          <Link
            href="/login"
            className="inline-block border border-black bg-black px-4 py-2 text-[13px] font-medium text-white hover:bg-black/90 rounded-none"
          >
            로그인하기
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-white text-black">
      <Header />
      <main className="mx-auto max-w-[480px] px-4 py-8">
        <h1 className="mb-6 text-[18px] font-semibold text-black">Musui 회원가입</h1>
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
              minLength={6}
              autoComplete="new-password"
            />
            <p className="mt-1 text-[11px] text-black/50">6자 이상 입력해 주세요.</p>
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
            {loading ? "가입 중…" : "회원가입"}
          </button>
        </form>
        <p className="mt-6 text-center text-[12px] text-black/60">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="underline">
            로그인
          </Link>
        </p>
      </main>
    </div>
  )
}
