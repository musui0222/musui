import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/** GET /api/auth/check-nickname?nickname=xxx — 닉네임 중복 여부 (서비스 롤 키 필요) */
export async function GET(request: NextRequest) {
  const nickname = request.nextUrl.searchParams.get("nickname")?.trim()
  if (!nickname) {
    return NextResponse.json({ available: false, error: "nickname required" }, { status: 400 })
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json(
      { available: false, error: "서버 설정이 필요합니다. SUPABASE_SERVICE_ROLE_KEY를 추가해 주세요." },
      { status: 503 }
    )
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("display_name", nickname)
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ available: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ available: !data })
}
