"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import { createClient } from "@/lib/supabase/client"

const inputClass =
  "w-full border border-black/15 bg-white px-2.5 py-2 text-[13px] outline-none focus:border-black/30 rounded-none"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true)
      } else {
        setError("유효한 링크가 아니거나 만료되었습니다. 비밀번호 찾기를 다시 시도해 주세요.")
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.")
      return
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.")
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) {
        setError(err.message)
        return
      }
      router.push("/login")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  if (!ready && !error) {
    return (
      <div className="min-h-dvh bg-white text-black">
        <Header />
        <main className="mx-auto max-w-[480px] px-4 py-8">
          <p className="text-[14px] text-black/60">확인 중...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-white text-black">
      <Header />
      <main className="mx-auto max-w-[480px] px-4 py-8">
        <h1 className="font-manrope mb-6 text-[18px] font-semibold text-black">새 비밀번호 설정</h1>
        {error && !ready ? (
          <div className="space-y-4">
            <p className="text-[14px] text-red-600">{error}</p>
            <Link href="/forgot-password" className="block text-[13px] underline">
              비밀번호 찾기 다시 시도
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-black/70">새 비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-black/70">비밀번호 확인</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
                required
                minLength={6}
                autoComplete="new-password"
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
              {loading ? "저장 중…" : "비밀번호 변경"}
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
