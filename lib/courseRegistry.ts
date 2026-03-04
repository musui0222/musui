/**
 * Tea Course registry: maps courseId (URL slug) to course metadata.
 * Supports clean URLs: /teacourse/altitude
 */

export type CourseMeta = {
  id: string
  title: string
  oneLiner: string
  poster: string
  totalMinutes: number
  concept: string
  /** Internal ID for DB (course_items, entitlements) */
  internalId: string
}

const COURSES: CourseMeta[] = [
  {
    id: "altitude",
    internalId: "session-1",
    title: "고도(高度)",
    oneLiner: "고산에서 내려오는 차의 여정",
    poster: "/posters/godo.png",
    totalMinutes: 30,
    concept:
      "이 코스는 해안 평지에서 시작해 2,000m 이상의 고산까지, 고도가 높아질수록 향의 밀도와 공기의 질감이 어떻게 달라지는지 경험하도록 설계되었습니다.",
  },
  {
    id: "session-1",
    internalId: "session-1",
    title: "고도(高度)",
    oneLiner: "고산에서 내려오는 차의 여정",
    poster: "/posters/godo.png",
    totalMinutes: 30,
    concept:
      "이 코스는 해안 평지에서 시작해 2,000m 이상의 고산까지, 고도가 높아질수록 향의 밀도와 공기의 질감이 어떻게 달라지는지 경험하도록 설계되었습니다.",
  },
]

const BY_ID = new Map(COURSES.map((c) => [c.id, c]))

/** Resolve courseId to internal ID for DB (course_items, entitlements) */
export function resolveInternalCourseId(courseId: string | null): string | null {
  const meta = courseId ? BY_ID.get(courseId) : null
  return meta?.internalId ?? (courseId || null)
}

/** Get course metadata by courseId */
export function getCourseById(courseId: string | null): CourseMeta | null {
  if (!courseId) return null
  return BY_ID.get(courseId) ?? null
}

/** All course IDs for iteration */
export function getKnownCourseIds(): string[] {
  return [...new Set(COURSES.map((c) => c.id))]
}

/** Check if user has access (entitlement for courseId or its internal alias) */
export function hasAccessForCourse(
  entitledCourseIds: string[],
  courseId: string
): boolean {
  const meta = BY_ID.get(courseId)
  if (!meta) return entitledCourseIds.includes(courseId)
  return (
    entitledCourseIds.includes(courseId) ||
    entitledCourseIds.includes(meta.internalId)
  )
}

/** Preferred URL slug for redirect (e.g. session-1 → altitude) */
export function getPreferredCourseId(internalId: string | null): string | null {
  if (!internalId) return null
  const c = COURSES.find((x) => x.internalId === internalId)
  return c ? c.id : internalId
}

/** Map redeem code (uppercase) to courseId for /start redirect */
const CODE_TO_COURSE: Record<string, string> = {
  ALTITUDE: "altitude",
}

export function resolveCourseIdFromCode(code: string | null): string | null {
  if (!code) return null
  const key = code.trim().toUpperCase()
  return CODE_TO_COURSE[key] ?? null
}
