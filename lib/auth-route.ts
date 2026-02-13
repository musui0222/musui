import { createServerClient } from "@supabase/ssr"
import type { NextRequest } from "next/server"
import type { NextResponse } from "next/server"
import { getSupabaseConfig } from "@/lib/supabase/env"

/**
 * Route Handler 전용 Supabase 클라이언트 (next/headers 미사용).
 * request/response로 쿠키 읽기·쓰기.
 */
export function createRouteHandlerClient(
  request: NextRequest,
  response: NextResponse
) {
  const { url, anonKey } = getSupabaseConfig()
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
