"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { getRequiredTagForCourse } from "@/lib/shopify-entitlement"
import { getTeaCourseSessionById } from "@/lib/teaCourseData"

/** 티코스 상품별 구매 페이지 URL (Shopify 스토어 상품 링크). 환경변수 또는 상수로 오버라이드 */
function getBuyUrl(courseId: string): string {
  const base = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL?.trim() || "https://your-store.myshopify.com"
  const slug = courseId === "session-1" ? "teacourse-1" : courseId === "session-2" ? "teacourse-2" : courseId === "session-3" ? "teacourse-3" : courseId === "session-4" ? "teacourse-4" : "teacourse"
  return `${base.replace(/\/$/, "")}/products/${slug}`
}

export default function TeaCourseGatePage() {
  const params = useParams()
  const courseId = typeof params.courseId === "string" ? params.courseId : null
  const [status, setStatus] = React.useState<"loading" | "login_required" | "not_entitled" | "entitled">("loading")
  const [entitledIds, setEntitledIds] = React.useState<string[]>([])
  const sessionTokenRef = React.useRef<string | null>(null)

  const course = courseId ? getTeaCourseSessionById(courseId) : null
  const requiredTag = courseId ? getRequiredTagForCourse(courseId) : null

  React.useEffect(() => {
    if (!courseId) {
      setStatus("not_entitled")
      return
    }

    const run = async () => {
      const token =
        typeof window !== "undefined"
          ? (window as unknown as { __SHOPIFY_SESSION_TOKEN__?: string }).__SHOPIFY_SESSION_TOKEN__
          : null
      sessionTokenRef.current = token ?? null

      const devCustomerId =
        typeof window !== "undefined" && typeof URLSearchParams !== "undefined"
          ? new URLSearchParams(window.location.search).get("customerId")
          : null

      const res = await fetch("/api/shopify/entitlement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken: token || undefined,
          customerId: devCustomerId || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.status === 401) {
        setStatus("login_required")
        return
      }

      const ids = Array.isArray(data.entitledCourseIds) ? data.entitledCourseIds : []
      setEntitledIds(ids)

      if (ids.includes(courseId)) {
        setStatus("entitled")
        return
      }

      setStatus("not_entitled")
    }

    run()
  }, [courseId])

  if (!courseId || !course) {
    return (
      <div className="min-h-dvh bg-white px-4 py-12 text-center text-black">
        <p className="text-[14px]">존재하지 않는 티코스입니다.</p>
        <Link href="/sessions" className="mt-4 inline-block text-[14px] underline">
          Tea Course 목록
        </Link>
      </div>
    )
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white text-black">
        <p className="text-[14px] text-black/70">권한 확인 중...</p>
      </div>
    )
  }

  if (status === "login_required") {
    return (
      <div className="min-h-dvh bg-white px-4 py-12 text-center text-black">
        <p className="text-[16px] font-medium">로그인이 필요합니다</p>
        <p className="mt-2 text-[14px] text-black/70">
          Shopify 스토어에 로그인한 뒤 다시 접속해 주세요.
        </p>
        <p className="mt-6 text-[12px] text-black/50">
          (App Proxy 또는 스토어 도메인에서 접속 시 세션 토큰이 전달됩니다)
        </p>
      </div>
    )
  }

  if (status === "not_entitled") {
    const buyUrl = getBuyUrl(courseId)
    return (
      <div className="min-h-dvh bg-white px-4 py-12 text-center text-black">
        <p className="text-[16px] font-medium">구매자 전용</p>
        <p className="mt-2 text-[14px] text-black/70">
          이 티코스는 구매 후 이용할 수 있습니다.
        </p>
        {requiredTag && (
          <p className="mt-1 text-[12px] text-black/50">필요 태그: {requiredTag}</p>
        )}
        <a
          href={buyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block border border-black bg-black px-4 py-2 text-[14px] font-medium text-white"
        >
          구매하러 가기
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-white text-black">
      <div className="mx-auto max-w-[480px] px-4 py-8">
        <p className="text-[14px] text-black/70">접근 권한이 확인되었습니다.</p>
        <Link
          href={`/session?course=${encodeURIComponent(courseId)}`}
          className="mt-4 inline-block border border-black bg-black px-4 py-2 text-[14px] font-medium text-white"
        >
          {course.title} 시작하기
        </Link>
      </div>
    </div>
  )
}
