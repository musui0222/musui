"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { getCourseById, hasAccessForCourse } from "@/lib/courseRegistry"

const DEFAULT_COURSE_ID = "altitude"

export default function TeaCourseGate() {
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get("code")?.trim()?.toUpperCase() ?? ""

  const [entitled, setEntitled] = React.useState<boolean | null>(null)
  const [user, setUser] = React.useState<{ id: string } | null>(null)
  const [code, setCode] = React.useState("")
  const [redeemStatus, setRedeemStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle")
  const [redeemError, setRedeemError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (codeFromUrl) setCode(codeFromUrl)
  }, [codeFromUrl])

  const courseId = DEFAULT_COURSE_ID
  const course = getCourseById(courseId) ?? {
    id: courseId,
    title: "",
    oneLiner: "",
    poster: "",
    totalMinutes: 30,
    concept: "",
  }
  const teaNames = ["하동 중작", "다즐링 퍼스트 플러쉬", "아리산 고산 오롱", "리산 고산 오롱"]

  React.useEffect(() => {
    Promise.all([
      fetch("/api/auth/user").then((r) => r.json()),
      fetch("/api/me/entitlements").then((r) => r.json()),
    ]).then(([authRes, entRes]) => {
      const auth = authRes as { user: { id: string } | null }
      const ent = entRes as { entitledCourseIds?: string[] }
      setUser(auth?.user ?? null)
      setEntitled(
        Array.isArray(ent?.entitledCourseIds) && hasAccessForCourse(ent.entitledCourseIds, courseId)
      )
    }).catch(() => {
      setUser(null)
      setEntitled(false)
    })
  }, [redeemStatus, courseId])

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setRedeemStatus("loading")
    setRedeemError(null)
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        const target = data.courseId ? `/teacourse/${data.courseId}` : `/teacourse/${courseId}`
        window.location.href = target
        return
      } else {
        setRedeemStatus("error")
        setRedeemError(data?.error ?? "코드 등록에 실패했습니다.")
      }
    } catch {
      setRedeemStatus("error")
      setRedeemError("네트워크 오류가 발생했습니다.")
    }
  }

  if (entitled === null) {
    return (
      <section>
        <h1 className="font-manrope mb-4 text-[16px] font-semibold tracking-[0.14em] uppercase text-black">
          Tea Course
        </h1>
        <p className="text-[13px] text-black/60">권한 확인 중...</p>
      </section>
    )
  }

  return (
    <section>
      <h1 className="font-manrope mb-4 text-[16px] font-semibold tracking-[0.14em] uppercase text-black">
        Tea Course
      </h1>

      {/* Preview: always shown */}
      <div className="mb-8 overflow-hidden border border-black/10 bg-white">
        {course.poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.poster}
            alt=""
            className="aspect-[3/4] w-full object-cover object-center"
          />
        )}
        <div className="border-t border-black/10 p-4">
          <h2 className="font-manrope text-[18px] font-semibold text-black">
            {course.title}
          </h2>
          <p className="mt-1 text-[13px] text-black/80">{course.oneLiner}</p>
          <p className="mt-3 text-[12px] leading-relaxed text-black/70">
            {course.concept}
          </p>
          <p className="mt-2 text-[11px] text-black/50">
            전체 소요 시간 약 {course.totalMinutes}분 · 4종의 차
          </p>
          <ul className="mt-2 space-y-0.5 text-[11px] text-black/60">
            {teaNames.map((name, i) => (
              <li key={i}>{name}</li>
            ))}
          </ul>
        </div>
      </div>

      {entitled ? (
        <div className="text-center">
          <Link
            href={`/teacourse/${courseId}`}
            className="inline-block w-full max-w-[280px] border border-black bg-black px-4 py-3 text-center text-[14px] font-medium text-white hover:bg-black/90"
          >
            티코스 시작하기
          </Link>
        </div>
      ) : !user ? (
        <div className="rounded border border-black/12 bg-black/[0.02] px-4 py-6 text-center">
          <p className="text-[13px] text-black/80">
            {codeFromUrl
              ? "로그인 후 코드를 등록하면 전체 코스를 이용할 수 있습니다."
              : "패키지에 포함된 코드를 등록하면 전체 코스를 이용할 수 있습니다."}
          </p>
          <p className="mt-2 text-[12px] text-black/60">
            로그인 후 코드를 입력해 주세요.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href={codeFromUrl ? `/login?redirect=${encodeURIComponent(`/teacourse/${courseId}?code=${codeFromUrl}`)}` : "/login"}
              className="border border-black bg-black px-4 py-2 text-[13px] font-medium text-white"
            >
              로그인
            </Link>
            <Link
              href={codeFromUrl ? `/signup?redirect=${encodeURIComponent(`/teacourse/${courseId}?code=${codeFromUrl}`)}` : "/signup"}
              className="border border-black px-4 py-2 text-[13px] font-medium text-black"
            >
              회원가입
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded border border-black/12 bg-black/[0.02] px-4 py-6">
          <p className="text-[13px] text-black/80">
            패키지에 포함된 코드를 입력해 주세요.
          </p>
          <form onSubmit={handleRedeem} className="mt-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="코드 입력"
              className="w-full border border-black/20 bg-white px-3 py-2.5 text-[14px] placeholder:text-black/40"
              disabled={redeemStatus === "loading"}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={redeemStatus === "loading" || !code.trim()}
              className="mt-3 w-full border border-black bg-black px-4 py-2.5 text-[13px] font-medium text-white hover:bg-black/90 disabled:opacity-50"
            >
              {redeemStatus === "loading" ? "등록 중…" : "Unlock Tea Course"}
            </button>
          </form>
          {redeemStatus === "error" && redeemError && (
            <p className="mt-2 text-[12px] text-red-600">{redeemError}</p>
          )}
        </div>
      )}
    </section>
  )
}
