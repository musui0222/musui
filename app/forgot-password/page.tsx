"use client"

import * as React from "react"
import Link from "next/link"
import Header from "@/components/header"
import { createClient } from "@/lib/supabase/client"

const inputClass =
  "w-full border border-black/15 bg-white px-2.5 py-2 text-[13px] outline-none focus:border-black/30 rounded-none"

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [sent, setSent] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const redirectTo = origin ? `${origin}/auth/callback?redirect_to=${encodeURIComponent("/reset-password")}` : ""
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (err) {
        setError(err.message)
        return
      }
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-white text-black">
      <Header />
      <main className="mx-auto max-w-[480px] px-4 py-8">
        <h1 className="font-manrope mb-6 text-[18px] font-semibold text-black">비밀번호 찾기</h1>
        {sent ? (
          <div className="space-y-4">
            <p className="text-[14px] text-black/80">
              <strong>{email}</strong>로 비밀번호 재설정 링크를 보냈습니다. 이메일을 확인해 주세요.
            </p>
            <p className="text-[12px] text-black/60">
              이메일이 보이지 않으면 스팸함을 확인해 보세요.
            </p>
            <Link href="/login" className="block text-center text-[13px] underline">
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
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
                placeholder="가입 시 사용한 이메일"
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
              {loading ? "전송 중…" : "재설정 링크 받기"}
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-[12px] text-black/60">
          <Link href="/login" className="underline">
            로그인
          </Link>
        </p>
      </main>
    </div>
  )
}
