/**
 * Shopify 티코스 접근 권한(Entitlement)
 * - 고객 태그: tc_1, tc_2, tc_3, tc_4 (티코스 상품 1:1)
 * - 구매 완료 시 해당 태그 자동 부여 → 이 페이지/API에서 태그로 접근 허용 여부 판단
 */

export const ENTITLEMENT_TAG_PREFIX = "tc_"

/** 티코스 세션 ID → Shopify 고객 태그 (상품별 1:1) */
export const COURSE_ID_TO_TAG: Record<string, string> = {
  "session-1": "tc_1",
  "session-2": "tc_2",
  "session-3": "tc_3",
  "session-4": "tc_4",
}

/** 태그 → 티코스 세션 ID */
export const TAG_TO_COURSE_ID: Record<string, string> = Object.fromEntries(
  Object.entries(COURSE_ID_TO_TAG).map(([k, v]) => [v, k])
)

export function getRequiredTagForCourse(courseId: string): string | null {
  return COURSE_ID_TO_TAG[courseId] ?? null
}

export function isCourseIdEntitled(courseId: string, customerTags: string[]): boolean {
  const tag = getRequiredTagForCourse(courseId)
  if (!tag) return false
  return customerTags.some((t) => t.trim().toLowerCase() === tag.toLowerCase())
}

/** customer tags 문자열(쉼표 구분) → 접근 가능한 courseId[] */
export function getEntitledCourseIds(customerTags: string[]): string[] {
  const normalized = customerTags.map((t) => t.trim().toLowerCase())
  return Object.entries(COURSE_ID_TO_TAG).filter(([, tag]) =>
    normalized.includes(tag.toLowerCase())
  ).map(([courseId]) => courseId)
}
