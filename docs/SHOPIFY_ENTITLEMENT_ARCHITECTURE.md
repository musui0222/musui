# Tea Course Entitlement — System Architecture Proposal

## Overview

When a user logs into our Next.js website (email-based auth), we show "Start Tea Course" UI only if they purchased a specific Shopify product. Credentials stay server-side; we use webhooks to store entitlements in our DB for fast login checks.

---

## 1) System Architecture

```
┌─────────────────┐     orders/paid      ┌──────────────────────┐
│  Shopify Store  │ ──────────────────►  │  Webhook Handler      │
│                 │     (HMAC verified)  │  POST /api/webhooks/  │
└─────────────────┘                      │  shopify/orders-paid  │
                                         └──────────┬───────────┘
                                                    │ upsert
                                                    ▼
┌─────────────────┐     GET /api/        ┌──────────────────────┐
│  Next.js App    │ ◄─────────────────  │  entitlements        │
│  (Client)       │     entitlements    │  (checks DB first)   │
└────────┬────────┘                      └──────────┬───────────┘
         │                                          │
         │ login (Supabase)                          │ SELECT by user_id
         ▼                                          ▼
┌─────────────────┐                      ┌──────────────────────┐
│  Supabase Auth  │                      │  Supabase DB         │
│  (profiles)     │  user_id ◄─────────  │  shopify_entitlements│
└─────────────────┘                      └──────────────────────┘
```

### Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/webhooks/shopify/orders-paid` | POST | Receive Shopify `orders/paid` webhook; upsert entitlements by email |
| `/api/entitlements` | GET | Return current user's Tea Course entitlements (from DB) |
| `/api/entitlements/sync` | POST | Optional: force sync from Shopify API (fallback if webhook missed) |

### Flow

1. **Webhook:** Shopify sends `orders/paid` → we verify HMAC → parse order → match product by tag/SKU → find user by email in `profiles` → upsert `shopify_entitlements`.
2. **Login:** User logs in (Supabase). Frontend calls `GET /api/entitlements` → server reads `shopify_entitlements` by `user_id` → returns `{ entitledCourseIds: string[] }`.
3. **UI:** If `entitledCourseIds.length > 0`, show "Start Tea Course" and allow access to purchased courses.

---

## 2) DB Schema (Supabase)

```sql
-- Shopify Tea Course entitlements (populated by webhook)
create table if not exists public.shopify_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,  -- e.g. 'session-1', 'session-2'
  shopify_order_id text,   -- for debugging/audit
  created_at timestamptz not null default now(),
  unique(user_id, course_id)
);

create index idx_shopify_entitlements_user_id on public.shopify_entitlements(user_id);

alter table public.shopify_entitlements enable row level security;

-- Users can only read their own entitlements
create policy "shopify_entitlements_select_own"
  on public.shopify_entitlements for select
  using (auth.uid() = user_id);

-- Webhook handler uses service role (bypasses RLS) to insert/upsert
```

---

## 3) Shopify Admin GraphQL — Orders by Email

```graphql
query GetPaidOrdersByEmail($email: String!, $first: Int!) {
  orders(
    first: $first
    query: "email:\($email) AND financial_status:paid"
  ) {
    edges {
      node {
        id
        email
        name
        lineItems(first: 50) {
          edges {
            node {
              id
              title
              sku
              product {
                id
                tags
              }
            }
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

**Identify Tea Course by:**
- **Product tag:** e.g. `product.tags` contains `"tea-course"` or `"tea-course:session-1"`
- **SKU:** e.g. `lineItem.sku` matches `"TC-1"`, `"TC-2"`, etc.

---

## 4) Next.js App Router — Route Handlers Skeleton

### 4.1 Webhook Handler (orders/paid)

```ts
// app/api/webhooks/shopify/orders-paid/route.ts
import { NextResponse } from "next/server"
import crypto from "crypto"

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET!
const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN!
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!

function verifyWebhook(body: string, hmacHeader: string): boolean {
  const hash = crypto
    .createHmac("sha256", SHOPIFY_WEBHOOK_SECRET)
    .update(body, "utf8")
    .digest("base64")
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader))
}

// Product tag or SKU → course_id mapping
const TEA_COURSE_TAG = "tea-course"
const SKU_TO_COURSE: Record<string, string> = { "TC-1": "session-1", "TC-2": "session-2", "TC-3": "session-3", "TC-4": "session-4" }

export async function POST(request: Request) {
  const hmac = request.headers.get("x-shopify-hmac-sha256")
  if (!hmac) return NextResponse.json({ error: "Missing HMAC" }, { status: 401 })

  const rawBody = await request.text()
  if (!verifyWebhook(rawBody, hmac)) return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 })

  const payload = JSON.parse(rawBody)
  const email = payload.email
  if (!email) return NextResponse.json({ ok: true }) // no customer email, skip

  const courseIds = new Set<string>()
  for (const item of payload.line_items ?? []) {
    const sku = item.sku
    if (sku && SKU_TO_COURSE[sku]) courseIds.add(SKU_TO_COURSE[sku])
    // Or check product tags via Admin API if not in payload
  }

  // Upsert into shopify_entitlements (use Supabase service role)
  // 1. Find user_id from profiles where email = payload.email
  // 2. For each courseId: insert into shopify_entitlements (user_id, course_id, shopify_order_id) on conflict do nothing

  return NextResponse.json({ ok: true })
}
```

### 4.2 Entitlements API (login check)

```ts
// app/api/entitlements/route.ts
import { NextResponse, type NextRequest } from "next/server"
import { createRouteHandlerClient } from "@/lib/auth-route"
import { getSupabaseConfigOrNull } from "@/lib/supabase/env"

export async function GET(request: NextRequest) {
  const config = getSupabaseConfigOrNull()
  if (!config) return NextResponse.json({ entitledCourseIds: [] })

  const res = NextResponse.json({})
  const supabase = createRouteHandlerClient(request, res, config)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ entitledCourseIds: [] })

  const { data } = await supabase
    .from("shopify_entitlements")
    .select("course_id")
    .eq("user_id", user.id)

  const entitledCourseIds = (data ?? []).map((r) => r.course_id)
  return NextResponse.json({ entitledCourseIds })
}
```

---

## 5) Webhook Verification (HMAC)

Shopify signs webhooks with `X-Shopify-Hmac-Sha256`:

1. **Get raw body** (must be raw, not parsed — use `request.text()`).
2. **Compute HMAC:** `HMAC-SHA256(rawBody, SHOPIFY_WEBHOOK_SECRET)`.
3. **Compare** with `X-Shopify-Hmac-Sha256` header using `crypto.timingSafeEqual`.

**Get webhook secret:** Shopify Admin → Settings → Notifications → Webhooks → create `Order payment` → copy "Signing secret" → `SHOPIFY_WEBHOOK_SECRET` in `.env.local`.

**Important:** Use `request.text()` to get raw body before verification. Do not use `request.json()` before HMAC check.

```ts
// next.config.js (if needed)
// experimental: { serverActions: { bodySizeLimit: '2mb' } }
```

For App Router, `request.text()` returns the raw body. Avoid `request.json()` before verification.

---

## 6) Product Identification (Tag vs SKU)

| Method | Pros | Cons |
|--------|------|------|
| **Product tag** | Flexible, no SKU management | Webhook payload may not include tags; may need extra Admin API call |
| **SKU** | In `line_items` in webhook | Requires SKU on each variant |
| **Product ID** | Simple, in payload | Must maintain ID mapping in env |

**Recommendation:** Use **SKU** for webhook (e.g. `TC-1`, `TC-2`) — it's in the payload and requires no extra API call. Add product tag `tea-course` for Admin API queries if you need a fallback sync.

---

## 7) Shopify Webhook Setup

1. Shopify Admin → Settings → Notifications → Webhooks.
2. Create webhook: **Event** = `Order payment`, **URL** = `https://your-domain.com/api/webhooks/shopify/orders-paid`.
3. Copy the **Signing secret** → `SHOPIFY_WEBHOOK_SECRET` in `.env.local`.
