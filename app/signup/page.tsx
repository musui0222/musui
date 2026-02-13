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
  const [passwordConfirm, setPasswordConfirm] = React.useState("")
  const [nickname, setNickname] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [done, setDone] = React.useState(false)

  const [emailChecked, setEmailChecked] = React.useState<boolean | null>(null)
  const [emailCheckLoading, setEmailCheckLoading] = React.useState(false)
  const [nicknameChecked, setNicknameChecked] = React.useState<boolean | null>(null)
  const [nicknameCheckLoading, setNicknameCheckLoading] = React.useState(false)

  const handleCheckEmail = async () => {
    const value = email.trim()
    if (!value) {
      setError("이메일을 입력한 뒤 중복 확인해 주세요.")
      return
    }
    setError(null)
    setEmailCheckLoading(true)
    setEmailChecked(null)
    try {
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(value)}`)
      const data = await res.json()
      if (res.ok) {
        setEmailChecked(data.available)
        if (!data.available) setError("이미 사용 중인 이메일입니다.")
      } else {
        setError(data.error || "확인에 실패했습니다.")
      }
    } catch {
      setError("확인에 실패했습니다.")
    } finally {
      setEmailCheckLoading(false)
    }
  }

  const handleCheckNickname = async () => {
    const value = nickname.trim()
    if (!value) {
      setError("닉네임을 입력한 뒤 중복 확인해 주세요.")
      return
    }
    setError(null)
    setNicknameCheckLoading(true)
    setNicknameChecked(null)
    try {
      const res = await fetch(`/api/auth/check-nickname?nickname=${encodeURIComponent(value)}`)
      const data = await res.json()
      if (res.ok) {
        setNicknameChecked(data.available)
        if (!data.available) setError("이미 사용 중인 닉네임입니다.")
      } else {
        setError(data.error || "확인에 실패했습니다.")
      }
    } catch {
      setError("확인에 실패했습니다.")
    } finally {
      setNicknameCheckLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.")
      return
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상 입력해 주세요.")
      return
    }

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
      const { error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: nickname.trim() || undefined },
        },
      })
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
        <h1 className="mb-6 text-[18px] font-semibold text-black">회원가입</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-black/70">이메일</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setEmailChecked(null)
                }}
                className={inputClass + " flex-1 min-w-0"}
                required
                autoComplete="email"
              />
              <button
                type="button"
                onClick={handleCheckEmail}
                disabled={emailCheckLoading}
                className="shrink-0 text-black/60 hover:text-black/80 hover:underline disabled:opacity-50"
                style={{ fontSize: "10px" }}
              >
                {emailCheckLoading ? "확인 중" : "중복 확인"}
              </button>
            </div>
            {emailChecked === true && (
              <p className="mt-1 text-[11px] text-green-700">사용 가능한 이메일입니다.</p>
            )}
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

          <div>
            <label className="mb-1 block text-[11px] font-medium text-black/70">비밀번호 확인</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className={inputClass}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-black/70">닉네임</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value)
                  setNicknameChecked(null)
                }}
                className={inputClass + " flex-1 min-w-0"}
                autoComplete="nickname"
              />
              <button
                type="button"
                onClick={handleCheckNickname}
                disabled={nicknameCheckLoading}
                className="shrink-0 text-black/60 hover:text-black/80 hover:underline disabled:opacity-50"
                style={{ fontSize: "10px" }}
              >
                {nicknameCheckLoading ? "확인 중" : "중복 확인"}
              </button>
            </div>
            {nicknameChecked === true && (
              <p className="mt-1 text-[11px] text-green-700">사용 가능한 닉네임입니다.</p>
            )}
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
