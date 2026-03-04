import { NextResponse, type NextRequest } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"
import { createRouteHandlerClient } from "@/lib/auth-route"
import { getSupabaseConfigOrNull } from "@/lib/supabase/env"
import { resolveInternalCourseId, getPreferredCourseId } from "@/lib/courseRegistry"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

const RATE_LIMIT_PER_MIN = 5
const BLOCK_THRESHOLD = 10
const BLOCK_MINUTES = 5

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + (process.env.REDEEM_SALT ?? "musui-redeem")).digest("hex").slice(0, 32)
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown"
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp
  return "unknown"
}

/**
 * POST /api/redeem
 *
 * 1. Validate code
 * 2. Check status and expiration
 * 3. Check usage limits
 * 4. Create entitlement (user_id, course_id)
 * 5. Insert redemption record
 * 6. Increment used_count
 *
 * Abuse: max 5 attempts/min per IP; 10+ = block 5 min
 */
export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "서버 설정 오류" }, { status: 503 })
  }

  const ip = getClientIp(request)
  const ipHash = hashIp(ip)

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const config = getSupabaseConfigOrNull()
  if (!config) return NextResponse.json({ error: "설정 오류" }, { status: 503 })

  const res = NextResponse.json({})
  const supabaseUser = createRouteHandlerClient(request, res, config)
  const {
    data: { user },
  } = await supabaseUser.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  let body: { code?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const code = body.code?.trim()?.toUpperCase()
  if (!code) {
    return NextResponse.json({ error: "코드를 입력해 주세요." }, { status: 400 })
  }

  // 개발용: DEV 코드 (NODE_ENV=development 또는 MUSUI_DEV_CODE=true일 때)
  const allowDevCode =
    process.env.NODE_ENV === "development" || process.env.MUSUI_DEV_CODE === "true"
  const isDevCode = code === "DEV" && allowDevCode
  if (isDevCode) {
    const email = user.email?.trim().toLowerCase() ?? ""
    if (!email) return NextResponse.json({ error: "이메일이 등록된 계정이 필요합니다." }, { status: 400 })
    const { error: entErr } = await supabaseAdmin.from("shopify_entitlements").upsert(
      {
        email,
        user_id: user.id,
        course_id: "session-1",
        purchase_count: 1,
        last_purchase_at: new Date().toISOString(),
      },
      { onConflict: "email,course_id" }
    )
    if (entErr) {
      console.error("[POST /api/redeem] dev entitlement", entErr)
      const errMsg =
        process.env.NODE_ENV === "development"
          ? `권한 부여 실패: ${entErr.message}`
          : "권한 부여에 실패했습니다."
      return NextResponse.json({ error: errMsg }, { status: 500 })
    }
    const preferred = getPreferredCourseId("session-1")
    return NextResponse.json({ ok: true, courseId: preferred ?? "session-1", message: "개발용 코드가 등록되었습니다." })
  }

  // Abuse protection: check before processing
  const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString()
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const { count: recentCount } = await supabaseAdmin
    .from("redeem_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("attempted_at", oneMinAgo)

  if ((recentCount ?? 0) >= BLOCK_THRESHOLD) {
    const { count: blockWindowCount } = await supabaseAdmin
      .from("redeem_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("attempted_at", fiveMinAgo)
    if ((blockWindowCount ?? 0) >= BLOCK_THRESHOLD) {
      return NextResponse.json(
        { error: "시도 횟수가 너무 많습니다. 5분 후에 다시 시도해 주세요." },
        { status: 429 }
      )
    }
  }

  if ((recentCount ?? 0) >= RATE_LIMIT_PER_MIN) {
    return NextResponse.json(
      { error: "시도 횟수가 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 }
    )
  }

  await supabaseAdmin.from("redeem_attempts").insert({ ip_hash: ipHash })

  // 1) Validate code
  const { data: codeRow, error: codeErr } = await supabaseAdmin
    .from("redeem_codes")
    .select("id, course_id, status, expires_at, max_uses, used_count")
    .eq("code", code)
    .maybeSingle()

  if (codeErr || !codeRow) {
    return NextResponse.json({ error: "유효하지 않은 코드입니다." }, { status: 400 })
  }

  // 2) Check status and expiration
  if (codeRow.status !== "active") {
    return NextResponse.json({ error: "사용할 수 없는 코드입니다." }, { status: 400 })
  }

  if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
    return NextResponse.json({ error: "만료된 코드입니다." }, { status: 400 })
  }

  // 3) Check usage limits
  if (codeRow.max_uses != null && (codeRow.used_count ?? 0) >= codeRow.max_uses) {
    return NextResponse.json({ error: "코드 사용 한도에 도달했습니다." }, { status: 400 })
  }

  // 4) Check if user already redeemed this code
  const { data: existingRedemption } = await supabaseAdmin
    .from("redeem_redemptions")
    .select("id")
    .eq("code", code)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existingRedemption) {
    return NextResponse.json({ error: "이미 이 코드를 사용하셨습니다." }, { status: 400 })
  }

  // 5) Create entitlement (user_id, course_id)
  const email = user.email?.trim().toLowerCase() ?? ""
  if (!email) {
    return NextResponse.json({ error: "이메일이 등록된 계정이 필요합니다." }, { status: 400 })
  }

  const internalCourseId = resolveInternalCourseId(codeRow.course_id) ?? codeRow.course_id

  const { error: entErr } = await supabaseUser.from("shopify_entitlements").upsert(
    {
      email,
      user_id: user.id,
      course_id: internalCourseId,
      purchase_count: 1,
      last_purchase_at: new Date().toISOString(),
    },
    { onConflict: "email,course_id" }
  )

  if (entErr) {
    console.error("[POST /api/redeem] entitlement upsert", entErr)
    return NextResponse.json({ error: "권한 부여에 실패했습니다." }, { status: 500 })
  }

  // 6) Insert redemption record
  const { error: redErr } = await supabaseAdmin.from("redeem_redemptions").insert({
    code,
    user_id: user.id,
    ip_hash: ipHash,
  })

  if (redErr) {
    if (redErr.code === "23505") {
      return NextResponse.json({ error: "이미 이 코드를 사용하셨습니다." }, { status: 400 })
    }
    console.error("[POST /api/redeem] redemption insert", redErr)
    return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 })
  }

  // 7) Increment used_count
  await supabaseAdmin
    .from("redeem_codes")
    .update({
      used_count: (codeRow.used_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", codeRow.id)

  const redirectCourseId = getPreferredCourseId(internalCourseId) ?? codeRow.course_id
  return NextResponse.json({
    ok: true,
    courseId: redirectCourseId,
    message: "코드가 등록되었습니다.",
  })
}
