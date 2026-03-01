"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
      <p className="mb-2 text-[14px] font-medium text-black">문제가 발생했습니다.</p>
      <p className="mb-4 text-[12px] text-black/60">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="border border-black/25 bg-white px-4 py-2 text-[12px] hover:bg-black/5"
      >
        다시 시도
      </button>
    </div>
  )
}
