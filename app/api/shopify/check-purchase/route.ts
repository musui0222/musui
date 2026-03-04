import { NextResponse, type NextRequest } from "next/server"
import { createRouteHandlerClient } from "@/lib/auth-route"
import { getSupabaseConfigOrNull } from "@/lib/supabase/env"
import { getEntitledCoursesByEmail } from "@/lib/shopify-purchase"

/**
 * GET /api/shopify/check-purchase
 *
 * 로그인한 사용자의 이메일로 Shopify 결제 완료 주문을 조회하고,
 * Tea Course 상품 구매 여부에 따른 접근 가능 티코스 목록을 반환합니다.
 *
 * - 로그인 필요 (Supabase 사용자)
 * - Shopify Admin API 사용 (SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_ACCESS_TOKEN)
 * - SHOPIFY_PRODUCT_IDS: "id1:session-1,id2:session-2" 또는 "id1,id2,id3,id4"
 */
export async function GET(request: NextRequest) {
  const config = getSupabaseConfigOrNull()
  if (!config) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 })
  }

  const response = NextResponse.json({})
  const supabase = createRouteHandlerClient(request, response, config)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    )
  }

  try {
    const result = await getEntitledCoursesByEmail(user.email)
    return NextResponse.json(result)
  } catch (e) {
    console.error("[check-purchase]", e)
    return NextResponse.json(
      { error: "구매 확인 실패", entitledCourseIds: [], hasPurchased: false },
      { status: 500 }
    )
  }
}
