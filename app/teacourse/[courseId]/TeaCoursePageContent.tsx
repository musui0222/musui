"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { getCourseById, hasAccessForCourse } from "@/lib/courseRegistry"

type Props = { courseId: string }

export default function TeaCoursePageContent({ courseId }: Props) {
  const router = useRouter()
  const course = getCourseById(courseId) ?? { id: courseId, title: "", oneLiner: "", poster: "" }
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get("code")?.trim()?.toUpperCase() ?? ""

  const [entitled, setEntitled] = React.useState<boolean | null>(null)
  const [hasRuns, setHasRuns] = React.useState(false)
  const [user, setUser] = React.useState<{ id: string } | null>(null)
  const [code, setCode] = React.useState("")
  const [redeemStatus, setRedeemStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle")
  const [redeemError, setRedeemError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (codeFromUrl) setCode(codeFromUrl)
  }, [codeFromUrl])

  const internalId = React.useMemo(
    () => (getCourseById(courseId)?.internalId ?? courseId),
    [courseId]
  )

  React.useEffect(() => {
    Promise.all([
      fetch("/api/auth/user").then((r) => r.json()),
      fetch("/api/me/entitlements").then((r) => r.json()),
      fetch(`/api/me/course-runs?courseId=${internalId}`).then((r) => r.json()),
    ]).then(([authRes, entRes, runsRes]) => {
      const auth = authRes as { user: { id: string } | null }
      const ent = entRes as { entitledCourseIds?: string[] }
      const runs = runsRes as { runs?: { id: string }[] }
      setUser(auth?.user ?? null)
      setEntitled(
        Array.isArray(ent?.entitledCourseIds) && hasAccessForCourse(ent.entitledCourseIds, courseId)
      )
      setHasRuns(Array.isArray(runs?.runs) && runs.runs.length > 0)
    }).catch(() => {
      setUser(null)
      setEntitled(false)
      setHasRuns(false)
    })
  }, [redeemStatus, courseId, internalId])

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
      } else {
        setRedeemStatus("error")
        setRedeemError(data?.error ?? "코드 등록에 실패했습니다.")
      }
    } catch {
      setRedeemStatus("error")
      setRedeemError("네트워크 오류가 발생했습니다.")
    }
  }

  const handleGoToIntro = () => {
    const base = `/teacourse/${courseId}/intro`
    router.push(codeFromUrl ? `${base}?code=${codeFromUrl}` : base)
  }

  const redirectBase = codeFromUrl ? `/teacourse/${courseId}?code=${codeFromUrl}` : `/teacourse/${courseId}`

  if (entitled === null) {
    return (
      <div className="min-h-dvh bg-white px-4 py-12 text-center text-black">
        <p className="text-[14px] text-black/70">권한 확인 중...</p>
      </div>
    )
  }

  if (!entitled) {
    return (
      <div className="min-h-dvh bg-white text-black">
        <div className="mx-auto max-w-[480px] px-4 py-8">
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
              <h2 className="font-manrope text-[18px] font-semibold text-black">{course.title}</h2>
              <p className="mt-1 text-[13px] text-black/80">{course.oneLiner}</p>
            </div>
          </div>
          {!user ? (
            <div className="rounded border border-black/12 bg-black/[0.02] px-4 py-6 text-center">
              <p className="text-[13px] text-black/80">
                패키지에 포함된 코드를 등록하면 전체 코스를 이용할 수 있습니다.
              </p>
              <p className="mt-2 text-[12px] text-black/60">로그인 후 코드를 입력해 주세요.</p>
              <div className="mt-4 flex justify-center gap-3">
                <Link
                  href={`/login?redirect=${encodeURIComponent(redirectBase)}`}
                  className="border border-black bg-black px-4 py-2 text-[13px] font-medium text-white"
                >
                  로그인
                </Link>
                <Link
                  href={`/signup?redirect=${encodeURIComponent(redirectBase)}`}
                  className="border border-black px-4 py-2 text-[13px] font-medium text-black"
                >
                  회원가입
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded border border-black/12 bg-black/[0.02] px-4 py-6">
              <p className="text-[13px] text-black/80">패키지에 포함된 코드를 입력해 주세요.</p>
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-white text-black">
      <div className="mx-auto max-w-[480px] px-4 py-8">
        <h2 className="font-manrope mb-4 text-[16px] font-semibold text-black">
          준비물
        </h2>
        <p className="mb-6 text-[14px] leading-relaxed text-black/85">
          뜨거운 물, 차를 우릴 수 있는 도구 (도구가 없다면 티백으로도 즐길 수 있습니다.)
        </p>
        <ul className="mb-8 space-y-3 text-[14px] leading-relaxed text-black/85">
          <li>• 차 4종과 뜨거운 물을 준비해 주세요.</li>
          <li>• 티코스를 시작하면 각 코스에 맞는 음악이 재생됩니다. 상단의 음소거 버튼을 통해 음악을 끄거나 다시 켤 수 있습니다.</li>
          <li>• <strong>무수이 타이머</strong> 버튼을 누르면 각 코스의 우림 시간이 자동으로 기록됩니다.</li>
          <li>• 코스가 끝난 후 남긴 기록은 <strong>마이 아카이브</strong>에서 확인하실 수 있습니다.</li>
        </ul>
        <button
          type="button"
          onClick={handleGoToIntro}
          className="w-full border border-black bg-black px-4 py-3 text-[14px] font-medium text-white hover:bg-black/90"
        >
          {hasRuns ? "티코스 다시 시작하기" : "티코스 시작하기"}
        </button>
      </div>
    </div>
  )
}
