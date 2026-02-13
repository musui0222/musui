import { createServerClient } from "@supabase/ssr"
import type { NextRequest } from "next/server"
import type { NextResponse } from "next/server"
import { getSupabaseConfig } from "@/lib/supabase/env"

type SupabaseConfig = { url: string; anonKey: string }

/**
 * Route Handler 전용 Supabase 클라이언트 (next/headers 미사용).
 * request/response로 쿠키 읽기·쓰기.
 * config를 넘기면 사용하고, 없으면 getSupabaseConfig() 사용 (서버에서 env 없을 때는 호출 전 getSupabaseConfigOrNull()로 체크 권장).
 */
export function createRouteHandlerClient(
  request: NextRequest,
  response: NextResponse,
  config?: SupabaseConfig
) {
  const { url, anonKey } = config ?? getSupabaseConfig()
  return createServerClient(url, anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
}
