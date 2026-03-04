import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET?.trim()
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

/** SKU → course_id */
const SKU_TO_COURSE: Record<string, string> = {
  "TC-1": "session-1",
  "TC-2": "session-2",
  "TC-3": "session-3",
  "TC-4": "session-4",
}

/** Product ID → course_id (from env SHOPIFY_PRODUCT_IDS=id1:session-1,id2:session-2) */
function getProductIdMapping(): Record<string, string> {
  const env = process.env.SHOPIFY_PRODUCT_IDS?.trim()
  if (!env) return {}
  const out: Record<string, string> = {}
  for (const p of env.split(",")) {
    const [id, course] = p.split(":").map((s) => s.trim())
    if (id && course) out[id] = course
  }
  return out
}

function verifyWebhook(body: string, hmacHeader: string): boolean {
  if (!SHOPIFY_WEBHOOK_SECRET) return false
  const hash = crypto
    .createHmac("sha256", SHOPIFY_WEBHOOK_SECRET)
    .update(body, "utf8")
    .digest("base64")
  return crypto.timingSafeEqual(Buffer.from(hash, "base64"), Buffer.from(hmacHeader, "base64"))
}

function matchCourseId(
  item: { sku?: string; product_id?: number },
  productIdMap: Record<string, string>
): string | null {
  const sku = item.sku?.trim()
  if (sku && SKU_TO_COURSE[sku]) return SKU_TO_COURSE[sku]
  const pid = item.product_id != null ? String(item.product_id) : ""
  if (pid && productIdMap[pid]) return productIdMap[pid]
  return null
}

export async function POST(request: Request) {
  const hmac = request.headers.get("x-shopify-hmac-sha256")
  if (!hmac) return NextResponse.json({ error: "Missing HMAC" }, { status: 401 })

  const rawBody = await request.text()
  if (!verifyWebhook(rawBody, hmac)) return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 })

  let payload: {
    email?: string
    contact_email?: string
    customer?: { id?: number }
    id?: number
    line_items?: Array<{ id?: number; sku?: string; product_id?: number }>
  }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = (payload.email || payload.contact_email || "").trim().toLowerCase()
  if (!email) return NextResponse.json({ ok: true })

  const productIdMap = getProductIdMapping()
  const lineItemsWithCourse = (payload.line_items ?? [])
    .map((item) => ({ item, courseId: matchCourseId(item, productIdMap) }))
    .filter((x): x is { item: (typeof payload.line_items)[number]; courseId: string } => x.courseId != null)

  if (lineItemsWithCourse.length === 0) return NextResponse.json({ ok: true })

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("[webhook orders-paid] Supabase not configured")
    return NextResponse.json({ ok: true })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const orderId = String(payload.id ?? "")
  const shopifyCustomerId = payload.customer?.id != null ? String(payload.customer.id) : null

  for (const { item, courseId } of lineItemsWithCourse) {
    const lineItemId = item.id != null ? String(item.id) : null
    if (!lineItemId) continue

    // Dedupe: skip if we already processed this line item
    const { data: existing } = await supabase
      .from("shopify_purchases")
      .select("id")
      .eq("shopify_order_id", orderId)
      .eq("shopify_line_item_id", lineItemId)
      .maybeSingle()

    if (existing) continue

    // Insert purchase event
    const { error: purchaseErr } = await supabase.from("shopify_purchases").insert({
      shopify_order_id: orderId,
      shopify_line_item_id: lineItemId,
      email,
      course_id: courseId,
    })
    if (purchaseErr) {
      // Likely duplicate (race) — skip
      if (purchaseErr.code === "23505") continue
      console.error("[webhook orders-paid] shopify_purchases insert", purchaseErr)
      continue
    }

    // Update entitlement: increment purchase_count
    const { data: ent } = await supabase
      .from("shopify_entitlements")
      .select("id, purchase_count")
      .eq("email", email)
      .eq("course_id", courseId)
      .maybeSingle()

    if (ent) {
      await supabase
        .from("shopify_entitlements")
        .update({
          purchase_count: (ent.purchase_count ?? 1) + 1,
          last_purchase_at: new Date().toISOString(),
          shopify_order_id: orderId,
          shopify_customer_id: shopifyCustomerId,
        })
        .eq("id", ent.id)
    } else {
      const { error: insertErr } = await supabase.from("shopify_entitlements").insert({
        email,
        user_id: null,
        course_id: courseId,
        shopify_order_id: orderId,
        shopify_customer_id: shopifyCustomerId,
        purchase_count: 1,
        last_purchase_at: new Date().toISOString(),
      })
      // Race: row created by another request — increment instead
      if (insertErr?.code === "23505") {
        const { data: ent2 } = await supabase
          .from("shopify_entitlements")
          .select("id, purchase_count")
          .eq("email", email)
          .eq("course_id", courseId)
          .maybeSingle()
        if (ent2) {
          await supabase
            .from("shopify_entitlements")
            .update({
              purchase_count: (ent2.purchase_count ?? 1) + 1,
              last_purchase_at: new Date().toISOString(),
              shopify_order_id: orderId,
              shopify_customer_id: shopifyCustomerId,
            })
            .eq("id", ent2.id)
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
