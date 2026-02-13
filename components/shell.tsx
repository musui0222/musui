"use client"

import * as React from "react"
import Header from "@/components/header"

function Shell({
  title,
  subtitle,
  rightAction,
  children,
}: {
  title: string
  subtitle?: string
  /** 오른쪽에 둘 요소 (예: + 버튼) */
  rightAction?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[480px] px-4 py-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-noto-sans text-[16px] font-medium tracking-[0.12em] uppercase text-black/80">
            {title}
          </h1>
          {rightAction != null ? <div className="shrink-0">{rightAction}</div> : null}
        </div>
        {subtitle ? (
          <div className="mt-2 text-[12px] leading-relaxed text-black/70">{subtitle}</div>
        ) : null}
        <div className="m-section">{children}</div>
      </main>
    </>
  )
}

export default Shell
