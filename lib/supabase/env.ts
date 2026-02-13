const PLACEHOLDER_URL = "your-project-ref"
const PLACEHOLDER_KEY = "your-anon-key"

/**
 * Supabase 설정은 환경 변수에서만 읽습니다.
 * 하드코딩/fallback/기본값 없음. placeholder 값 사용 시 throw.
 */
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("[Supabase env] process.env.NEXT_PUBLIC_SUPABASE_URL =", url)
  }

  if (!url || url.trim() === "") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다. .env.local을 확인하고 .next 삭제 후 개발 서버를 재시작하세요."
    )
  }
  if (url.includes(PLACEHOLDER_URL)) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL이 placeholder(${PLACEHOLDER_URL})입니다. .env.local에 실제 Supabase Project URL을 넣고, .next 폴더 삭제 후 개발 서버를 완전 재시작하세요.`
    )
  }
  return url.trim()
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key || key.trim() === "") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다. .env.local을 확인하고 .next 삭제 후 개발 서버를 재시작하세요."
    )
  }
  if (key === PLACEHOLDER_KEY || key.includes(PLACEHOLDER_KEY)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY가 placeholder입니다. .env.local에 실제 anon key를 넣고, .next 폴더 삭제 후 개발 서버를 완전 재시작하세요."
    )
  }
  return key.trim()
}

export function getSupabaseConfig() {
  const url = getSupabaseUrl()
  const anonKey = getSupabaseAnonKey()
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    try {
      const host = new URL(url).host
      console.log("[Supabase env] supabaseUrl host (사용값):", host)
    } catch {
      // ignore
    }
  }
  return { url, anonKey }
}

/**
 * 서버 전용. env가 없거나 placeholder면 null 반환 (throw 안 함).
 * Vercel 등에서 env 미설정 시 500 방지.
 */
export function getSupabaseConfigOrNull(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key || url.includes(PLACEHOLDER_URL) || key.includes(PLACEHOLDER_KEY)) {
    return null
  }
  return { url, anonKey: key }
}
