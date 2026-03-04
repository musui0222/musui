import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET?.trim()
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

/** SKU → course_id (Shopify variant SKU) */
const SKU_TO_COURSE: Record<string, string> = {
  "TC-1": "session-1",
  "TC-2": "session-2",
  "TC-3": "session-3",
  "TC-4": "session-4",
}

function verifyWebhook(body: string, hmacHeader: string): boolean {
  if (!SHOPIFY_WEBHOOK_SECRET) return false
  const hash = crypto
    .createHmac("sha256", SHOPIFY_WEBHOOK_SECRET)
    .update(body, "utf8")
    .digest("base64")
  return crypto.timingSafeEqual(Buffer.from(hash, "base64"), Buffer.from(hmacHeader, "base64"))
}

export async function POST(request: Request) {
  const hmac = request.headers.get("x-shopify-hmac-sha256")
  if (!hmac) return NextResponse.json({ error: "Missing HMAC" }, { status: 401 })

  const rawBody = await request.text()
  if (!verifyWebhook(rawBody, hmac)) return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 })

  let payload: { email?: string; id?: number; line_items?: Array<{ sku?: string }> }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = payload.email || (payload as { contact_email?: string }).contact_email
  if (!email || typeof email !== "string") return NextResponse.json({ ok: true })

  const courseIds = new Set<string>()
  for (const item of payload.line_items ?? []) {
    const sku = item.sku?.trim()
    if (sku && SKU_TO_COURSE[sku]) courseIds.add(SKU_TO_COURSE[sku])
  }

  if (courseIds.size === 0) return NextResponse.json({ ok: true })

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("[webhook] Supabase not configured")
    return NextResponse.json({ ok: true })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .single()

  if (!profile?.id) return NextResponse.json({ ok: true })

  const orderId = String(payload.id ?? "")

  for (const courseId of courseIds) {
    await supabase.from("shopify_entitlements").upsert(
      { user_id: profile.id, course_id: courseId, shopify_order_id: orderId },
      { onConflict: "user_id,course_id" }
    )
  }

  return NextResponse.json({ ok: true })
}
