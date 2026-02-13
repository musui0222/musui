import { createBrowserClient } from "@supabase/ssr"
import { getSupabaseConfig } from "./env"

const isDev = typeof process !== "undefined" && process.env.NODE_ENV === "development"

function createLoggingFetch(): typeof fetch {
  const realFetch = globalThis.fetch.bind(globalThis)
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
    const isSignup =
      url.includes("supabase.co") && (url.includes("/auth/v1/signup") || url.includes("/auth/v1/token"))
    try {
      const res = await realFetch(input, init)
      if (isDev && isSignup) {
        const status = res.status
        let body: string | null = null
        try {
          const clone = res.clone()
          body = await clone.text()
        } catch {
          body = "(body 읽기 실패)"
        }
        console.log("[Supabase signup 요청]", {
          "Request URL": url,
          "Status code": status,
          "Response body": body ?? "(없음)",
        })
        if (status === 401 || status === 403) {
          console.warn(
            "[Supabase] 401/403 → anon key 문제일 수 있습니다. Dashboard → Settings → API에서 Legacy anon(public) JWT 키(eyJ...)로 바꾸고 서버 재시작 후 다시 시도하세요."
          )
        }
      }
      return res
    } catch (e) {
      if (isDev && isSignup) {
        console.log("[Supabase signup 요청 실패 - 응답 전 에러]", {
          "Request URL": url,
          error: e instanceof Error ? e.message : String(e),
        })
        console.warn(
          "[Supabase] CORS/네트워크일 수 있습니다. Dashboard → Authentication → URL Configuration에서 Site URL에 http://localhost:3004, Redirect URLs에 http://localhost:3004, http://localhost:3004/auth/callback 추가 후 저장하세요."
        )
      }
      throw e
    }
  }
}

export function createClient() {
  const { url, anonKey } = getSupabaseConfig()
  const options = isDev ? { global: { fetch: createLoggingFetch() } } : undefined
  return createBrowserClient(url, anonKey, options)
}
