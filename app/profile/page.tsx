"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/header"

const inputClass =
  "w-full border border-black/15 bg-white px-2.5 py-2 text-[13px] outline-none focus:border-black/30 rounded-none"

type Profile = { id: string; email: string | null; displayName: string | null; updatedAt: string }

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [displayName, setDisplayName] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<{ type: "ok" | "error"; text: string } | null>(null)

  React.useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data: { profile: { id: string; email: string | null; displayName: string | null; updatedAt: string } | null }) => {
        if (data.profile) {
          setProfile(data.profile)
          setDisplayName(data.profile.displayName ?? "")
        } else {
          setProfile(null)
        }
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    if (!loading && profile === null) {
      router.replace("/login")
    }
  }, [loading, profile, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName.trim() || "" }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setProfile((p) => (p ? { ...p, displayName: displayName.trim() || null } : null))
        setMessage({ type: "ok", text: "저장되었습니다." })
      } else {
        setMessage({ type: "error", text: "저장에 실패했습니다." })
      }
    } catch {
      setMessage({ type: "error", text: "저장에 실패했습니다." })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-white text-black">
        <Header />
        <main className="mx-auto max-w-[480px] px-4 py-8">
          <p className="text-[13px] text-black/60">불러오는 중…</p>
        </main>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-dvh bg-white text-black">
      <Header />
      <main className="mx-auto max-w-[480px] px-4 py-8">
        <h1 className="mb-6 text-[18px] font-semibold text-black">Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-black/70">닉네임</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputClass}
              placeholder="커뮤니티에 표시될 이름"
              autoComplete="nickname"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-black/70">이메일</label>
            <input
              type="email"
              value={profile.email ?? ""}
              readOnly
              className={inputClass + " bg-black/5 cursor-not-allowed"}
              aria-readonly
            />
            <p className="mt-1 text-[11px] text-black/50">이메일은 수정할 수 없습니다.</p>
          </div>
          {message && (
            <p
              className={`text-[12px] ${message.type === "ok" ? "text-green-700" : "text-red-600"}`}
              role="alert"
            >
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full border border-black bg-black py-3 text-[13px] font-medium text-white hover:bg-black/90 disabled:opacity-60 rounded-none"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </form>
      </main>
    </div>
  )
}
