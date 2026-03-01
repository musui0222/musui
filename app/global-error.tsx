"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 24, fontFamily: "sans-serif" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 600 }}>페이지를 불러올 수 없습니다.</p>
          <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>{error.message}</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              border: "1px solid #ccc",
              background: "#fff",
              fontSize: 12,
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  )
}
