"use client"

import * as React from "react"
import Link from "next/link"
import { hasAccessForCourse } from "@/lib/courseRegistry"

type Props = {
  courseId: string
  codeFromUrl?: string
}

export default function TeaCourseCodeBlock({ courseId, codeFromUrl = "" }: Props) {
  const [entitled, setEntitled] = React.useState<boolean | null>(null)
  const [user, setUser] = React.useState<{ id: string } | null>(null)
  const [code, setCode] = React.useState(codeFromUrl)
  const [redeemStatus, setRedeemStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle")
  const [redeemError, setRedeemError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (codeFromUrl) setCode(codeFromUrl)
  }, [codeFromUrl])

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
      <div className="tc-modal-code">
        <p style={{ margin: 0 }}>권한 확인 중...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="tc-modal-code">
        <p>
          {codeFromUrl
            ? "로그인 후 코드를 등록하면 전체 코스를 이용할 수 있습니다."
            : "패키지에 포함된 코드를 등록하면 전체 코스를 이용할 수 있습니다."}
        </p>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>로그인 후 코드를 입력해 주세요.</p>
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href={codeFromUrl ? `/login?redirect=${encodeURIComponent(`/teacourse/${courseId}?code=${codeFromUrl}`)}` : "/login"}
            style={{
              border: "1px solid var(--ink)",
              background: "var(--ink)",
              color: "#fff",
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            로그인
          </Link>
          <Link
            href={codeFromUrl ? `/signup?redirect=${encodeURIComponent(`/teacourse/${courseId}?code=${codeFromUrl}`)}` : "/signup"}
            style={{
              border: "1px solid var(--ink)",
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            회원가입
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="tc-modal-code">
      <p>패키지에 포함된 코드를 입력해 주세요.</p>
      <form onSubmit={handleRedeem}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="코드 입력"
          disabled={redeemStatus === "loading"}
          autoComplete="off"
        />
        <button type="submit" disabled={redeemStatus === "loading" || !code.trim()}>
          {redeemStatus === "loading" ? "등록 중…" : "Unlock Tea Course"}
        </button>
      </form>
      {redeemStatus === "error" && redeemError && (
        <p style={{ fontSize: 12, color: "#b91c1c", marginTop: 8 }}>{redeemError}</p>
      )}
      {entitled && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--hair2)" }}>
          <Link
            href={`/teacourse/${courseId}`}
            style={{
              display: "block",
              width: "100%",
              border: "1px solid var(--ink)",
              background: "var(--ink)",
              color: "#fff",
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 500,
              textAlign: "center",
            }}
          >
            티코스 시작하기
          </Link>
        </div>
      )}
    </div>
  )
}
