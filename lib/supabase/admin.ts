import { createClient } from "@supabase/supabase-js"

/**
 * 서버 전용. 이메일/닉네임 중복 확인 등에 사용.
 * SUPABASE_SERVICE_ROLE_KEY가 없으면 null 반환.
 */
export function createAdminClient(): ReturnType<typeof createClient> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !serviceRoleKey) return null
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } })
}
