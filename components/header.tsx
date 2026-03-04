"use client"

import * as React from "react"
import Link from "next/link"

type AuthUser = { id: string; email: string | null; displayName?: string | null } | null

/**
 * Header: Logo (top) – Navigation (center) – Account info (right)
 */
export default function Header() {
  const [user, setUser] = React.useState<AuthUser>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/auth/user")
      .then((res) => res.json())
      .then((data: { user: AuthUser }) => {
        setUser(data?.user ?? null)
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <header className="site-header border-b border-black/15 lg:border-b-0 lg:border-r lg:border-black/15">
      <div className="site-header-inner mx-auto flex max-w-[480px] flex-col gap-6 px-3 py-2.5 pb-4 lg:max-w-none lg:flex-col lg:items-stretch lg:gap-0 lg:py-2.5">
        <div className="hidden" aria-hidden />
        <Link
          href="/"
          aria-label="musui 홈"
          className="flex shrink-0 items-center justify-center self-center lg:justify-start lg:self-auto lg:mb-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-graphic.png" alt="musui" style={{ height: 28, width: "auto" }} />
        </Link>
        <div className="flex items-center justify-between gap-6 lg:contents">
          <nav className="site-nav flex flex-1 items-center justify-center lg:flex-initial lg:flex-col lg:items-stretch lg:justify-start">
          <div className="flex items-center gap-6 lg:flex-col lg:items-stretch lg:gap-0">
            <a
              href="https://musui.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-medium hover:underline lg:py-2"
            >
              Shop
            </a>
            <Link href="/magazine" className="text-[13px] font-medium hover:underline lg:py-2">
              Magazine
            </Link>
            <Link href="/sessions" className="whitespace-nowrap text-[13px] font-medium hover:underline lg:py-2">
              Tea Course
            </Link>
            <Link href="/archive" className="whitespace-nowrap text-[13px] font-medium hover:underline lg:py-2">
              My Archive
            </Link>
          </div>
          <div className="h-px bg-black/15 lg:hidden" />
          </nav>
          <div className="flex shrink-0 items-center gap-2 text-[10px] text-black/60 lg:mt-auto lg:flex-col lg:items-start lg:gap-1 lg:text-[11px]">
          {loading ? (
            <span className="text-black/50">...</span>
          ) : user ? (
            <>
              <Link
                href="/profile"
                className="max-w-[100px] truncate text-black/65 hover:underline"
                title={user.email ?? undefined}
              >
                {user.displayName || user.email}님
              </Link>
              <form action="/api/auth/signout" method="POST" className="m-0 inline lg:block">
                <button
                  type="submit"
                  className="m-0 inline leading-none text-black/60 hover:underline lg:block lg:text-left"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/signup"
                className="w-fit rounded-full bg-black px-2.5 py-1.5 text-[11px] leading-none text-white"
                style={{ color: "#fff" }}
              >
                Musui 회원가입
              </Link>
              <Link href="/login" className="text-black/75 hover:underline">
                로그인
              </Link>
            </>
          )}
          </div>
        </div>
      </div>
    </header>
  )
}
