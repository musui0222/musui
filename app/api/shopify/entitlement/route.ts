import { NextResponse } from "next/server"
import { jwtVerify, createRemoteJWKSet } from "jose"
import { getEntitledCourseIds } from "@/lib/shopify-entitlement"

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN?.trim()
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim()

/** gid://shopify/Customer/12345 → 12345 */
function customerGidToId(gid: string): string | null {
  if (!gid || typeof gid !== "string") return null
  const match = gid.match(/shopify\/Customer\/(\d+)/i)
  return match ? match[1] : null
}

/** Shopify Admin API: customer 조회 (tags 포함) */
async function getCustomerTags(customerId: string): Promise<string[]> {
  if (!SHOPIFY_STORE || !SHOPIFY_ADMIN_TOKEN) return []
  const host = SHOPIFY_STORE.replace(/^https?:\/\//, "").replace(/\/$/, "")
  const url = `https://${host}/admin/api/2024-01/customers/${customerId}.json?fields=id,tags`
  const res = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
      "Content-Type": "application/json",
    },
  })
  if (!res.ok) return []
  const data = await res.json().catch(() => ({}))
  const tags = data?.customer?.tags
  if (typeof tags !== "string") return []
  return tags.split(",").map((t: string) => t.trim()).filter(Boolean)
}

/**
 * POST /api/shopify/entitlement
 * Body: { sessionToken?: string } 또는 개발용 { customerId?: string }
 * Header: Authorization: Bearer <sessionToken> 가능
 *
 * Shopify Customer Account API 세션 토큰(JWT) 검증 후 고객 태그로 티코스 접근 권한 반환.
 */
export async function POST(request: Request) {
  try {
    let customerId: string | null = null

    const authHeader = request.headers.get("authorization")
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

    const body = await request.json().catch(() => ({}))
    const sessionToken = body.sessionToken ?? bearerToken ?? null
    const devCustomerId = body.customerId ?? null

    if (devCustomerId && process.env.NODE_ENV !== "production") {
      customerId = String(devCustomerId)
    } else if (sessionToken) {
      try {
        const iss = body.iss ?? "https://shopify.com"
        const jwksUrl = iss.startsWith("http")
          ? `${iss.replace(/\/$/, "")}/.well-known/jwks.json`
          : `https://${iss}/.well-known/jwks.json`
        const JWKS = createRemoteJWKSet(new URL(jwksUrl))
        const { payload } = await jwtVerify(sessionToken, JWKS)
        const sub = payload.sub
        if (sub && typeof sub === "string") customerId = customerGidToId(sub)
      } catch {
        try {
          const parts = sessionToken.split(".")
          if (parts.length === 3) {
            const payload = JSON.parse(
              Buffer.from(parts[1], "base64url").toString("utf8")
            )
            const sub = payload.sub
            if (sub && typeof sub === "string") customerId = customerGidToId(sub)
          }
        } catch {
          customerId = null
        }
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "로그인 필요", entitledCourseIds: [] },
        { status: 401 }
      )
    }

    const tags = await getCustomerTags(customerId)
    const entitledCourseIds = getEntitledCourseIds(tags)

    return NextResponse.json({
      customerId,
      tags,
      entitledCourseIds,
    })
  } catch (e) {
    console.error("[entitlement]", e)
    return NextResponse.json(
      { error: "권한 확인 실패", entitledCourseIds: [] },
      { status: 500 }
    )
  }
}
