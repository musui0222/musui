"use client"

import * as React from "react"
import Link from "next/link"

type AuthUser = { id: string; email: string | null } | null

/**
 * 홈과 동일한 상단: 가운데 로고, 오른쪽 로그인 상태(비로그인: 회원가입/로그인, 로그인: 이메일/로그아웃), 네비
 */
export default function Header() {
  const [user, setUser] = React.useState<AuthUser>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/auth/user")
      .then((res) => res.json())
      .then((data: { user: AuthUser }) => {
        setUser(data.user)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <header className="border-b border-black/15">
      <div className="relative mx-auto flex max-w-[480px] items-center justify-between px-3 py-2.5">
        <div className="w-16 shrink-0" aria-hidden />
        <Link
          href="/"
          aria-label="musui 홈"
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-graphic.png" alt="musui" style={{ height: 28, width: "auto" }} />
        </Link>
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-[11px] text-black/50">...</span>
          ) : user ? (
            <>
              <span
                className="max-w-[120px] truncate text-[11px] text-black/70"
                title={user.email ?? undefined}
              >
                {user.email}
              </span>
              <form action="/api/auth/signout" method="POST">
                <button type="submit" className="text-[12px] leading-none text-black/75 hover:underline">
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/signup"
                className="rounded-full bg-black px-2.5 py-1.5 text-[12px] leading-none text-white"
                style={{ color: "#fff" }}
              >
                Musui 회원가입
              </Link>
              <Link href="/login" className="text-[12px] leading-none text-black/75">
                로그인
              </Link>
            </>
          )}
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
  )
}
