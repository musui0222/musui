/**
 * Shopify Admin API: 이메일로 구매 여부 확인
 * - Orders API로 해당 이메일의 결제 완료 주문 조회
 * - line_items에서 Tea Course 상품(product_id) 확인
 */

import { COURSE_ID_TO_TAG } from "./shopify-entitlement"

/** Shopify 상품 ID → 티코스 세션 ID (Shopify Admin에서 상품 ID 확인 후 설정) */
export const SHOPIFY_PRODUCT_TO_COURSE: Record<string, string> = {
  // 예: "123456789": "session-1", "123456790": "session-2", ...
  // .env의 SHOPIFY_PRODUCT_IDS 또는 여기 하드코딩
}

/** env에서 상품 ID 매핑 로드 (쉼표 구분: "id1:session-1,id2:session-2" 또는 "id1,id2,id3,id4" → session-1~4) */
function getProductMapping(): Record<string, string> {
  const env = process.env.SHOPIFY_PRODUCT_IDS?.trim()
  if (!env) return {}

  const entries: Record<string, string> = {}
  const parts = env.split(",").map((p) => p.trim())
  const courseIds = Object.keys(COURSE_ID_TO_TAG)

  if (parts.every((p) => p.includes(":"))) {
    for (const p of parts) {
      const [id, course] = p.split(":").map((s) => s.trim())
      if (id && course) entries[id] = course
    }
  } else {
    parts.forEach((id, i) => {
      if (courseIds[i]) entries[id] = courseIds[i]
    })
  }
  return { ...SHOPIFY_PRODUCT_TO_COURSE, ...entries }
}

export interface ShopifyOrderLineItem {
  product_id: number
  variant_id: number
  title: string
}

export interface ShopifyOrder {
  id: number
  email: string | null
  financial_status: string
  line_items: ShopifyOrderLineItem[]
}

/** Shopify Admin API: 이메일로 결제 완료 주문 조회 */
export async function getPaidOrdersByEmail(
  storeDomain: string,
  adminToken: string,
  email: string
): Promise<ShopifyOrder[]> {
  const host = storeDomain.replace(/^https?:\/\//, "").replace(/\/$/, "")
  const url = `https://${host}/admin/api/2024-01/orders.json?email=${encodeURIComponent(email)}&financial_status=paid&limit=250`
  const res = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": adminToken,
      "Content-Type": "application/json",
    },
  })
  if (!res.ok) return []
  const data = await res.json().catch(() => ({}))
  const orders = data?.orders ?? []
  return orders
}

/** 주문에서 구매한 티코스 세션 ID 목록 반환 */
export function getPurchasedCourseIdsFromOrders(
  orders: ShopifyOrder[],
  productMapping: Record<string, string>
): string[] {
  const ids = new Set<string>()
  for (const order of orders) {
    for (const item of order.line_items ?? []) {
      const pid = String(item.product_id)
      const courseId = productMapping[pid]
      if (courseId) ids.add(courseId)
    }
  }
  return [...ids]
}

/** 이메일 + Shopify 설정으로 접근 가능한 티코스 목록 반환 */
export async function getEntitledCoursesByEmail(
  email: string
): Promise<{ entitledCourseIds: string[]; hasPurchased: boolean }> {
  const store = process.env.SHOPIFY_STORE_DOMAIN?.trim()
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim()
  if (!store || !token) return { entitledCourseIds: [], hasPurchased: false }

  const mapping = getProductMapping()
  if (Object.keys(mapping).length === 0) return { entitledCourseIds: [], hasPurchased: false }

  const orders = await getPaidOrdersByEmail(store, token, email)
  const entitledCourseIds = getPurchasedCourseIdsFromOrders(orders, mapping)

  return {
    entitledCourseIds,
    hasPurchased: entitledCourseIds.length > 0,
  }
}
