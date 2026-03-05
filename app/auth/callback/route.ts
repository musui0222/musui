import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseConfigOrNull } from "@/lib/supabase/env"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const redirectParam = requestUrl.searchParams.get("redirect_to") ?? "/"
  const redirectTo = redirectParam.startsWith("/") ? `${requestUrl.origin}${redirectParam}` : redirectParam
  const response = NextResponse.redirect(redirectTo)

  const config = getSupabaseConfigOrNull()
  if (!config) {
    return response
  }

  const { url, anonKey } = config
  const supabase = createServerClient(url, anonKey,
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

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  return response
}
