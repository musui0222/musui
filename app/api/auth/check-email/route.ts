import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/** GET /api/auth/check-email?email=xxx — 이메일 중복 여부 (서비스 롤 키 필요) */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ available: false, error: "email required" }, { status: 400 })
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json(
      { available: false, error: "서버 설정이 필요합니다. SUPABASE_SERVICE_ROLE_KEY를 추가해 주세요." },
      { status: 503 }
    )
  }

  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const exists = (data?.users ?? []).some((u) => (u.email ?? "").toLowerCase() === email)
  return NextResponse.json({ available: !exists })
}
